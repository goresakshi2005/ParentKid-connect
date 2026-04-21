"""
backend/apps/study_planner/views.py

Key change: voice input may contain MULTIPLE tasks in one paragraph.
_parse_with_gemini now ALWAYS returns a LIST of task dicts.
parse_voice  → returns { parsed: [task, task, ...] }
add_from_voice → saves ALL tasks in the list, syncs each to Google Calendar,
                 returns { created: true, tasks: [...], count: N }
"""

import json
import re
from datetime import date, timedelta, datetime
import logging

import google.generativeai as genai
from django.conf import settings
from rest_framework import status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet

from .models import StudyTask
from .serializers import StudyTaskSerializer, VoiceInputSerializer

logger = logging.getLogger(__name__)
genai.configure(api_key=settings.GEMINI_API_KEY)

# ---------------------------------------------------------------------------
# AI PARSING — returns a LIST of task dicts (even for a single task)
def _parse_with_gemini(voice_text: str) -> list:
    """
    Call Gemini to convert natural-language input (which may describe MULTIPLE
    tasks in one paragraph) into a list of structured task dicts.

    Each dict has keys:
        title, type, date, time, deadline, reminder, priority,
        calendar_event, missing_date
    """
    today_obj = date.today()
    today_str = today_obj.isoformat()

    prompt = f"""
Today's date is {today_str}.
You are an AI academic task parser for a teen student planner.

The user may describe ONE or MORE tasks in a single message
(e.g. "I have a Math test on 10th April and I need to submit my Science project
by 15th April, also a meeting with mentor tomorrow at 5 PM").

Extract EVERY task mentioned and return a JSON ARRAY where each element is
an object with EXACTLY these keys:

- "title": short task title (string)
- "type": one of ["Task", "Meeting", "Test/Exam", "Assignment/Deadline"]
- "date": YYYY-MM-DD (convert relative dates like "tomorrow", "Sunday", "next Monday")
- "time": "HH:MM" in 24-hr format, or null if not mentioned
- "deadline": true if it is a submission/deadline, false otherwise
- "reminder": "30 minutes before" if timed event, "2 days before" if deadline
- "priority": "High" for exams/tests/deadlines, "Medium" for meetings, "Low" for general tasks
- "calendar_event": {{ "create": true, "event_type": "timed" }} if time given,
                    {{ "create": true, "event_type": "all-day deadline" }} if deadline,
                    {{ "create": false }} otherwise
- "missing_date": true if the date is completely absent and cannot be inferred

Respond ONLY with a valid JSON array. No explanation, no markdown backticks.

Voice input: "{voice_text}"
"""
    model = genai.GenerativeModel("gemini-3-flash-preview")
    response = model.generate_content(prompt)
    raw = response.text.strip()

    # Strip markdown code fences
    raw = re.sub(r"^```(?:json)?\s*", "", raw)
    raw = re.sub(r"\s*```$", "", raw)

    _default_task = {
        "title": "Untitled Task",
        "type": "Task",
        "date": today_str,
        "time": None,
        "deadline": False,
        "reminder": "30 minutes before",
        "priority": "Medium",
        "calendar_event": {"create": False},
        "missing_date": False,
    }

    try:
        parsed = json.loads(raw)
    except json.JSONDecodeError:
        return [{**_default_task, "missing_date": True, "title": ""}]

    # Normalise: always work with a list
    if isinstance(parsed, dict):
        parsed = [parsed]

    if not isinstance(parsed, list) or not parsed:
        return [{**_default_task, "missing_date": True, "title": ""}]

    # Fill in missing keys for every task
    result = []
    for item in parsed:
        if not isinstance(item, dict):
            continue
        task = {**_default_task, **item}
        result.append(task)

    return result if result else [{**_default_task, "missing_date": True, "title": ""}]


# ---------------------------------------------------------------------------
# GOOGLE CALENDAR SYNC
# ---------------------------------------------------------------------------

def _sync_with_google_calendar(task):
    """
    If the user has Google OAuth tokens, create a Calendar event for this task.
    Returns the google_event_id, or None.
    """
    user = task.user
    if not user.google_access_token or not user.google_refresh_token:
        logger.info(f"User {user.email} has no Google tokens. Skipping calendar sync.")
        return None

    try:
        from apps.reports.services.calendar_service import build_calendar_service, create_study_task_event

        service, new_token = build_calendar_service(user.google_access_token, user.google_refresh_token)
        if new_token and new_token != user.google_access_token:
            user.google_access_token = new_token
            user.save(update_fields=["google_access_token"])
            logger.info(f"Refreshed Google access token for user {user.email}")

        event_id = create_study_task_event(service, task)
        logger.info(f"Created Google Calendar event {event_id} for task {task.id} (user {user.email})")
        return event_id
    except Exception as e:
        logger.error(f"Google Calendar sync failed for task {task.id}: {str(e)}", exc_info=True)
        return None


# ---------------------------------------------------------------------------
# VIEWSET
# ---------------------------------------------------------------------------

from apps.users.permissions import HasFeaturePermission

class StudyTaskViewSet(ModelViewSet):
    serializer_class = StudyTaskSerializer
    permission_classes = [IsAuthenticated, HasFeaturePermission("study_planner")]

    def get_queryset(self):
        qs = StudyTask.objects.filter(user=self.request.user)
        task_filter = self.request.query_params.get('filter')
        today = date.today()
        if task_filter == 'upcoming':
            qs = qs.filter(status='Pending', date__gte=today)
        elif task_filter == 'deadlines':
            qs = qs.filter(deadline=True, status='Pending')
        elif task_filter == 'completed':
            qs = qs.filter(status='Completed')
        return qs

    def perform_create(self, serializer):
        task = serializer.save(user=self.request.user)
        # Sync to Google Calendar (for manually created tasks)
        event_id = _sync_with_google_calendar(task)
        if event_id:
            task.google_calendar_event_id = event_id
            task.save(update_fields=["google_calendar_event_id"])

    # ------------------------------------------------------------------
    @action(detail=False, methods=['post'], url_path='parse_voice')
    def parse_voice(self, request):
        """
        Preview only — parse the voice text and return all detected tasks
        WITHOUT saving them.

        Response shape:
            { "parsed": [ task_dict, task_dict, ... ] }
        or, if any task is missing a date:
            { "needs_clarification": true, "question": "...", "partial": [...] }
        """
        ser = VoiceInputSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        voice_text = ser.validated_data['voice_text']

        try:
            tasks = _parse_with_gemini(voice_text)
        except Exception as e:
            return Response(
                {'error': f'AI parsing failed: {str(e)}'},
                status=status.HTTP_502_BAD_GATEWAY,
            )

        # If ANY task is missing a date, ask for clarification
        if any(t.get('missing_date') for t in tasks):
            return Response(
                {
                    'needs_clarification': True,
                    'question': 'Some tasks are missing a date. Could you provide the dates?',
                    'partial': tasks,
                },
                status=status.HTTP_200_OK,
            )

        return Response({'parsed': tasks}, status=status.HTTP_200_OK)

    # ------------------------------------------------------------------
    @action(detail=False, methods=['post'], url_path='add_from_voice')
    def add_from_voice(self, request):
        """
        Parse the voice text, save ALL detected tasks (skipping duplicates),
        and sync each one to Google Calendar.

        Response shape:
            {
              "created": true,
              "count": N,
              "tasks": [ serialized_task, ... ],
              "skipped_duplicates": [ title, ... ]   # tasks already in DB
            }
        """
        ser = VoiceInputSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        voice_text = ser.validated_data['voice_text']

        try:
            parsed_tasks = _parse_with_gemini(voice_text)
        except Exception as e:
            return Response(
                {'error': f'AI parsing failed: {str(e)}'},
                status=status.HTTP_502_BAD_GATEWAY,
            )

        # If any task is missing a date, ask for clarification before saving
        if any(t.get('missing_date') for t in parsed_tasks):
            return Response(
                {
                    'needs_clarification': True,
                    'question': 'Some tasks are missing a date. Could you specify the dates?',
                    'partial': parsed_tasks,
                },
                status=status.HTTP_200_OK,
            )

        created_tasks = []
        skipped = []
        today = date.today()

        for parsed in parsed_tasks:
            title = parsed.get('title', 'Untitled Task')
            task_date = parsed.get('date', today.isoformat())

            # Duplicate check per task
            existing = StudyTask.objects.filter(
                user=request.user,
                title__iexact=title,
                date=task_date,
            ).first()

            if existing:
                skipped.append(title)
                continue

            task = StudyTask.objects.create(
                user=request.user,
                title=title,
                task_type=parsed.get('type', 'Task'),
                date=task_date,
                time=parsed.get('time'),
                deadline=parsed.get('deadline', False),
                reminder=parsed.get('reminder', '30 minutes before'),
                priority=parsed.get('priority', 'Medium'),
                voice_input=voice_text,
                parsed_json=parsed,
            )

            # Sync to Google Calendar
            event_id = _sync_with_google_calendar(task)
            if event_id:
                task.google_calendar_event_id = event_id
                task.save(update_fields=["google_calendar_event_id"])

            created_tasks.append(task)

        return Response(
            {
                'created': True,
                'count': len(created_tasks),
                'tasks': StudyTaskSerializer(created_tasks, many=True).data,
                'skipped_duplicates': skipped,
            },
            status=status.HTTP_201_CREATED,
        )


    # ------------------------------------------------------------------
    @action(detail=True, methods=['patch'], url_path='update_status')
    def update_status(self, request, pk=None):
        task = self.get_object()
        new_status = request.data.get('status')
        if new_status not in ('Pending', 'Completed'):
            return Response(
                {'error': 'status must be Pending or Completed'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        task.status = new_status
        task.save()
        return Response(StudyTaskSerializer(task).data)

    # ------------------------------------------------------------------
    def destroy(self, request, *args, **kwargs):
        """Override delete to also remove the Google Calendar event if it exists."""
        task = self.get_object()
        if task.google_calendar_event_id:
            try:
                from apps.reports.services.calendar_service import build_calendar_service, delete_calendar_event
                user = request.user
                if user.google_access_token and user.google_refresh_token:
                    service, new_token = build_calendar_service(user.google_access_token, user.google_refresh_token)
                    if new_token and new_token != user.google_access_token:
                        user.google_access_token = new_token
                        user.save(update_fields=["google_access_token"])
                    delete_calendar_event(service, task.google_calendar_event_id)
                    logger.info(f"Deleted Google Calendar event {task.google_calendar_event_id} for task {task.id}")
            except Exception as e:
                logger.error(f"Failed to delete calendar event for task {task.id}: {e}")
        return super().destroy(request, *args, **kwargs)
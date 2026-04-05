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

TODAY = date.today()


def _parse_with_gemini(voice_text: str) -> dict:
    """
    Call Gemini to convert natural-language academic input into structured JSON.
    Returns a dict with keys: title, type, date, time, deadline, reminder,
    priority, calendar_event, missing_date.
    """
    today_str = TODAY.isoformat()

    prompt = f"""
Today's date is {today_str}.
You are an AI academic task parser for a teen student planner.

From the following voice input, extract a JSON object with EXACTLY these keys:
- "title": short task title (string)
- "type": one of ["Task", "Meeting", "Test/Exam", "Assignment/Deadline"]
- "date": YYYY-MM-DD (convert relative dates like "tomorrow", "Sunday", "next Monday")
- "time": "HH:MM" in 24-hr format, or null if not mentioned
- "deadline": true if it is a submission/deadline, false otherwise
- "reminder": "30 minutes before" if timed event, "2 days before" if deadline
- "priority": "High" for exams/tests/deadlines, "Medium" for meetings, "Low" for general tasks
- "calendar_event": {{ "create": true, "event_type": "timed" }} if time given,
                    {{ "create": true, "event_type": "all-day deadline" }} if deadline
- "missing_date": true if the date is completely absent and you cannot infer it, otherwise false

Respond ONLY with valid JSON. No explanation, no markdown.

Voice input: "{voice_text}"
"""
    model = genai.GenerativeModel("gemini-2.5-flash")
    response = model.generate_content(prompt)
    raw = response.text.strip()

    # Strip markdown code fences
    raw = re.sub(r"^```(?:json)?\s*", "", raw)
    raw = re.sub(r"\s*```$", "", raw)

    try:
        parsed = json.loads(raw)
    except json.JSONDecodeError:
        # Fallback: return a minimal dict with missing_date=True
        return {
            "title": "",
            "type": "Task",
            "date": "",
            "time": None,
            "deadline": False,
            "reminder": "30 minutes before",
            "priority": "Medium",
            "calendar_event": {"create": False},
            "missing_date": True,
        }

    # Ensure parsed is a dict, not a list
    if isinstance(parsed, list):
        if parsed and isinstance(parsed[0], dict):
            parsed = parsed[0]
        else:
            return {
                "title": "",
                "type": "Task",
                "date": "",
                "time": None,
                "deadline": False,
                "reminder": "30 minutes before",
                "priority": "Medium",
                "calendar_event": {"create": False},
                "missing_date": True,
            }

    # Ensure all required keys exist with defaults
    defaults = {
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
    for key, default in defaults.items():
        if key not in parsed:
            parsed[key] = default

    return parsed


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


class StudyTaskViewSet(ModelViewSet):
    serializer_class = StudyTaskSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = StudyTask.objects.filter(user=self.request.user)
        task_filter = self.request.query_params.get('filter')
        if task_filter == 'upcoming':
            qs = qs.filter(status='Pending', date__gte=TODAY)
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
        ser = VoiceInputSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        voice_text = ser.validated_data['voice_text']

        try:
            parsed = _parse_with_gemini(voice_text)
        except Exception as e:
            return Response(
                {'error': f'AI parsing failed: {str(e)}'},
                status=status.HTTP_502_BAD_GATEWAY,
            )

        if parsed.get('missing_date'):
            return Response(
                {
                    'needs_clarification': True,
                    'question': 'Could you tell me the date for this task?',
                    'partial': parsed,
                },
                status=status.HTTP_200_OK,
            )

        return Response({'parsed': parsed}, status=status.HTTP_200_OK)

    # ------------------------------------------------------------------
    @action(detail=False, methods=['post'], url_path='add_from_voice')
    def add_from_voice(self, request):
        ser = VoiceInputSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        voice_text = ser.validated_data['voice_text']

        try:
            parsed = _parse_with_gemini(voice_text)
        except Exception as e:
            return Response(
                {'error': f'AI parsing failed: {str(e)}'},
                status=status.HTTP_502_BAD_GATEWAY,
            )

        if parsed.get('missing_date'):
            return Response(
                {
                    'needs_clarification': True,
                    'question': 'Could you tell me the date for this task?',
                },
                status=status.HTTP_200_OK,
            )

        # Duplicate check
        existing = StudyTask.objects.filter(
            user=request.user,
            title__iexact=parsed.get('title', ''),
            date=parsed.get('date'),
        ).first()

        if existing:
            return Response(
                {
                    'duplicate': True,
                    'message': 'A task with this title and date already exists.',
                    'task': StudyTaskSerializer(existing).data,
                },
                status=status.HTTP_200_OK,
            )

        task = StudyTask.objects.create(
            user=request.user,
            title=parsed.get('title', 'Untitled Task'),
            task_type=parsed.get('type', 'Task'),
            date=parsed.get('date', TODAY.isoformat()),
            time=parsed.get('time'),
            deadline=parsed.get('deadline', False),
            reminder=parsed.get('reminder', '30 minutes before'),
            priority=parsed.get('priority', 'Medium'),
            voice_input=voice_text,
            parsed_json=parsed,
        )

        # Sync to Google Calendar (for voice-created tasks)
        event_id = _sync_with_google_calendar(task)
        if event_id:
            task.google_calendar_event_id = event_id
            task.save(update_fields=["google_calendar_event_id"])

        return Response(
            {'created': True, 'task': StudyTaskSerializer(task).data},
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
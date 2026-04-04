import json
import re
from datetime import date, timedelta, datetime

import google.generativeai as genai
from django.conf import settings
from rest_framework import status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet

from .models import StudyTask
from .serializers import StudyTaskSerializer, VoiceInputSerializer

genai.configure(api_key=settings.GEMINI_API_KEY)

TODAY = date.today()


def _parse_with_gemini(voice_text: str) -> dict:
    """
    Call Gemini to convert natural-language academic input into structured JSON.
    Returns a dict with keys: title, type, date, time, deadline, reminder,
    priority, calendar_event.
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

    # strip markdown fences if present
    raw = re.sub(r"^```(?:json)?", "", raw).strip()
    raw = re.sub(r"```$", "", raw).strip()

    return json.loads(raw)


class StudyTaskViewSet(ModelViewSet):
    """
    CRUD for StudyTask + custom actions:
      POST /api/study-tasks/parse_voice/   – parse voice text, return JSON (no save)
      POST /api/study-tasks/add_from_voice/ – parse + save to DB
      PATCH /api/study-tasks/{id}/update_status/ – toggle Pending / Completed
    """
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
        serializer.save(user=self.request.user)

    # ------------------------------------------------------------------ #
    @action(detail=False, methods=['post'], url_path='parse_voice')
    def parse_voice(self, request):
        """
        Parse a voice text string and return structured JSON without saving.
        Useful for preview before saving.
        """
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

    # ------------------------------------------------------------------ #
    @action(detail=False, methods=['post'], url_path='add_from_voice')
    def add_from_voice(self, request):
        """
        Parse voice text and immediately persist the task.
        Prevents duplicates: checks title + date + user.
        """
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

        return Response(
            {'created': True, 'task': StudyTaskSerializer(task).data},
            status=status.HTTP_201_CREATED,
        )

    # ------------------------------------------------------------------ #
    @action(detail=True, methods=['patch'], url_path='update_status')
    def update_status(self, request, pk=None):
        """Toggle task status between Pending and Completed."""
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
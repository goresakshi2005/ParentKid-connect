from datetime import datetime, timedelta
import logging

import google.auth.transport.requests
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from django.conf import settings
from django.utils import timezone

logger = logging.getLogger(__name__)


def build_calendar_service(access_token: str, refresh_token: str):
    """
    Build and return an authenticated Google Calendar service.
    Also returns the (possibly refreshed) access token.
    """
    creds = Credentials(
        token=access_token,
        refresh_token=refresh_token,
        token_uri="https://oauth2.googleapis.com/token",
        client_id=settings.GOOGLE_CLIENT_ID,
        client_secret=settings.GOOGLE_CLIENT_SECRET,
        expiry=None,  # forces refresh if needed
    )

    request = google.auth.transport.requests.Request()
    if not creds.valid:
        creds.refresh(request)

    service = build("calendar", "v3", credentials=creds)
    return service, creds.token


def create_appointment_event(
    service,
    appointment_datetime: datetime,
    doctor: str,
    parent_email: str,
    timezone_str: str = "Asia/Kolkata",
) -> str:
    """
    Creates a Google Calendar event for a pregnancy appointment.
    Returns the created event ID.
    """
    end_datetime = appointment_datetime + timedelta(minutes=30)

    description = "Auto-extracted from your uploaded pregnancy checkup report."
    if doctor:
        description += f"\nDoctor: {doctor}"

    event = {
        "summary": "🤰 Pregnancy Checkup Appointment",
        "description": description,
        "colorId": "7",   # Peacock blue
        "start": {
            "dateTime": appointment_datetime.isoformat(),
            "timeZone": timezone_str,
        },
        "end": {
            "dateTime": end_datetime.isoformat(),
            "timeZone": timezone_str,
        },
        "attendees": [{"email": parent_email}],
        "reminders": {
            "useDefault": False,
            "overrides": [
                {"method": "email", "minutes": 24 * 60},
                {"method": "popup", "minutes": 120},
            ],
        },
    }

    created_event = service.events().insert(calendarId="primary", body=event, sendUpdates="all").execute()
    return created_event.get("id")


def delete_calendar_event(service, event_id: str):
    """Delete a calendar event by ID."""
    service.events().delete(calendarId="primary", eventId=event_id).execute()


# ===== Study Task event creation (fixed) =====
def create_study_task_event(
    service,
    task,
    timezone_str: str = "Asia/Kolkata",
) -> str:
    """
    Creates a Google Calendar event for a StudyTask.
    - If task.time is present → timed event (30 min duration)
    - If task.time is absent (deadline) → all-day event
    Returns the created event ID.
    """
    # Ensure we use a timezone-aware datetime for timed events
    if task.time:
        # Normalize date and time in case they are strings (e.g. from voice parsing)
        if isinstance(task.date, str):
            try:
                date_obj = datetime.strptime(task.date, "%Y-%m-%d").date()
            except Exception:
                # best-effort fallback
                date_obj = datetime.fromisoformat(task.date).date()
        else:
            date_obj = task.date

        if isinstance(task.time, str):
            try:
                time_obj = datetime.strptime(task.time, "%H:%M").time()
            except Exception:
                # try parsing with seconds if present
                time_obj = datetime.fromisoformat(task.time).time()
        else:
            time_obj = task.time

        # Combine date and time, then make it timezone-aware
        naive_dt = datetime.combine(date_obj, time_obj)
        aware_dt = timezone.make_aware(naive_dt, timezone.get_current_timezone())
        start_datetime = aware_dt
        end_datetime = start_datetime + timedelta(minutes=30)

        event_body = {
            "summary": f"📚 {task.title}",
            "description": f"Task type: {task.task_type}\nPriority: {task.priority}\nReminder: {task.reminder}",
            "colorId": "5",   # Banana yellow for study tasks
            "start": {
                "dateTime": start_datetime.isoformat(),
                "timeZone": timezone_str,
            },
            "end": {
                "dateTime": end_datetime.isoformat(),
                "timeZone": timezone_str,
            },
            "reminders": {
                "useDefault": False,
                "overrides": [
                    {"method": "email", "minutes": 60},
                    {"method": "popup", "minutes": 30},
                ],
            },
        }
    else:
        # All-day deadline — normalize date if it's a string
        if isinstance(task.date, str):
            try:
                date_obj = datetime.strptime(task.date, "%Y-%m-%d").date()
            except Exception:
                date_obj = datetime.fromisoformat(task.date).date()
        else:
            date_obj = task.date

        end_date = date_obj + timedelta(days=1)   # all-day events need exclusive end date
        event_body = {
            "summary": f"📌 DEADLINE: {task.title}",
            "description": f"Task type: {task.task_type}\nPriority: {task.priority}\nReminder: {task.reminder}",
            "colorId": "11",   # Tomato red for deadlines
            "start": {"date": date_obj.isoformat()},
            "end": {"date": end_date.isoformat()},
            "reminders": {
                "useDefault": False,
                "overrides": [
                    {"method": "email", "minutes": 24 * 60},
                    {"method": "popup", "minutes": 60},
                ],
            },
        }

    created_event = service.events().insert(calendarId="primary", body=event_body, sendUpdates="all").execute()
    event_id = created_event.get("id")
    logger.info(f"Created study task calendar event: {event_id} for task {task.id}")
    return event_id
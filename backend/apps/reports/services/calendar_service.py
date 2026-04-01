from datetime import datetime, timedelta
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from django.conf import settings


def build_calendar_service(access_token: str, refresh_token: str) -> object:
    """Build and return an authenticated Google Calendar service."""
    creds = Credentials(
        token=access_token,
        refresh_token=refresh_token,
        token_uri="https://oauth2.googleapis.com/token",
        client_id=settings.GOOGLE_CLIENT_ID,
        client_secret=settings.GOOGLE_CLIENT_SECRET,
    )
    service = build("calendar", "v3", credentials=creds)
    return service


def create_appointment_event(
    service,
    appointment_datetime: datetime,
    doctor: str,
    parent_email: str,
    timezone: str = "Asia/Kolkata",
) -> str:
    """
    Creates a Google Calendar event for the appointment.
    Returns the created event ID.
    """
    end_datetime = appointment_datetime + timedelta(minutes=30)

    description = "Auto-extracted from your uploaded pregnancy checkup report."
    if doctor:
        description += f"\nDoctor: {doctor}"

    event = {
        "summary": "Pregnancy Checkup Appointment",
        "description": description,
        "start": {
            "dateTime": appointment_datetime.isoformat(),
            "timeZone": timezone,
        },
        "end": {
            "dateTime": end_datetime.isoformat(),
            "timeZone": timezone,
        },
        "attendees": [
            {"email": parent_email},
        ],
        "reminders": {
            "useDefault": False,
            "overrides": [
                {"method": "email", "minutes": 24 * 60},   # 1 day before
                {"method": "popup", "minutes": 120},        # 2 hours before
            ],
        },
    }

    created_event = service.events().insert(
        calendarId="primary",
        body=event,
        sendUpdates="all",
    ).execute()

    return created_event.get("id")


def delete_calendar_event(service, event_id: str):
    """Delete a calendar event by ID."""
    service.events().delete(calendarId="primary", eventId=event_id).execute()
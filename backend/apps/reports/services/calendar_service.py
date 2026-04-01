from datetime import datetime, timedelta

import google.auth.transport.requests
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from django.conf import settings


def build_calendar_service(access_token: str, refresh_token: str):
    """
    Build and return an authenticated Google Calendar service.

    ✅ FIX: Previously, the Credentials object was built with no `expiry` field,
    so the library never knew the token was stale and never refreshed it.
    Access tokens expire in ~1 hour — after that, every Calendar call silently
    failed, was caught by the broad `except` in orchestrator.py, and the event
    was skipped entirely (hence nothing appearing in Google Calendar).

    Fix: force a refresh() call before building the service so we always have
    a valid token. We also return the (possibly new) access token so the caller
    can persist it back to the DB.

    Returns:
        (service, new_access_token) — the Calendar service and the refreshed token.
    """
    creds = Credentials(
        token=access_token,
        refresh_token=refresh_token,
        token_uri="https://oauth2.googleapis.com/token",
        client_id=settings.GOOGLE_CLIENT_ID,
        client_secret=settings.GOOGLE_CLIENT_SECRET,
        # expiry=None → library treats the token as already expired → triggers refresh
        expiry=None,
    )

    # Force refresh so we always use a live access token
    request = google.auth.transport.requests.Request()
    if not creds.valid:
        creds.refresh(request)

    service = build("calendar", "v3", credentials=creds)

    # Return the (possibly refreshed) access token alongside the service
    return service, creds.token


def create_appointment_event(
    service,
    appointment_datetime: datetime,
    doctor: str,
    parent_email: str,
    timezone: str = "Asia/Kolkata",
) -> str:
    """
    Creates a Google Calendar event for the appointment.

    ✅ FIX: Added `colorId: "7"` (Peacock / blue) so the event appears as a
    solid blue block in Google Calendar — matching the style shown in the
    screenshot.  Without a colorId the event inherits the calendar's default
    colour which can be hard to spot.

    colorId reference:
      1=Lavender  2=Sage      3=Grape    4=Flamingo  5=Banana
      6=Tangerine 7=Peacock   8=Graphite 9=Blueberry 10=Basil  11=Tomato

    Returns the created event ID.
    """
    end_datetime = appointment_datetime + timedelta(minutes=30)

    description = "Auto-extracted from your uploaded pregnancy checkup report."
    if doctor:
        description += f"\nDoctor: {doctor}"

    event = {
        "summary": "🤰 Pregnancy Checkup Appointment",
        "description": description,
        # Peacock blue — visible and distinct in Google Calendar
        "colorId": "7",
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
                {"method": "email", "minutes": 24 * 60},  # 1 day before
                {"method": "popup", "minutes": 120},       # 2 hours before
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
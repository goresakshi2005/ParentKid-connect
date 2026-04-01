from datetime import datetime
from django.utils import timezone
from django.utils.timezone import make_aware

from .extractor import extract_text_from_file
from .ai_extractor import extract_appointment_from_text
from apps.reports.models import MedicalReport, Appointment


def process_report_and_schedule(
    report: MedicalReport,
    access_token: str,
    refresh_token: str,
) -> dict:
    """
    Full pipeline:
    1. Extract text from uploaded report
    2. Use Gemini to extract appointment details
    3. Return extracted details (do NOT schedule yet — let user confirm)
    """
    # Step 1: Extract text
    file_path = report.file.path
    extracted_text = extract_text_from_file(file_path)

    if not extracted_text:
        return {"success": False, "error": "Could not extract text from the report."}

    # Save extracted text
    report.extracted_text = extracted_text
    report.save()

    # Step 2: AI extraction
    appointment_data = extract_appointment_from_text(extracted_text)

    date_str = appointment_data.get("date")
    time_str = appointment_data.get("time")
    doctor = appointment_data.get("doctor", "")

    if not date_str:
        return {"success": False, "error": "No appointment date found in the report."}

    # Step 3: Parse datetime
    try:
        if time_str:
            dt = datetime.strptime(f"{date_str} {time_str}", "%Y-%m-%d %I:%M %p")
        else:
            dt = datetime.strptime(date_str, "%Y-%m-%d")
            dt = dt.replace(hour=10, minute=0)  # default 10:00 AM if no time
    except ValueError as e:
        return {"success": False, "error": f"Could not parse date/time: {str(e)}"}

    # Validate: appointment must be in the future
    aware_dt = make_aware(dt)
    if aware_dt <= timezone.now():
        return {"success": False, "error": "Extracted appointment date is in the past."}

    # Return for user confirmation (not yet scheduled)
    return {
        "success": True,
        "appointment": {
            "date": date_str,
            "time": time_str or "10:00 AM (default)",
            "doctor": doctor,
            "datetime_iso": aware_dt.isoformat(),
        },
        "report_id": report.id,
    }


def confirm_and_schedule(
    report: MedicalReport,
    datetime_iso: str,
    doctor: str,
    access_token: str,
    refresh_token: str,
) -> dict:
    """
    After user confirms, save the appointment to DB.
    Google Calendar scheduling is optional — only runs if user has connected Google account.

    ✅ FIX: build_calendar_service() now returns (service, new_access_token).
    We unpack that tuple and persist the refreshed access token back to the DB
    so future uploads don't silently fail with a stale token.
    """
    user = report.user
    dt = datetime.fromisoformat(datetime_iso)

    google_event_id = None

    # ✅ Only attempt Google Calendar if user has OAuth tokens connected
    if access_token and refresh_token:
        try:
            from .calendar_service import build_calendar_service, create_appointment_event
            from django.conf import settings

            # Only proceed if Google credentials are configured
            if getattr(settings, 'GOOGLE_CLIENT_ID', '') and getattr(settings, 'GOOGLE_CLIENT_SECRET', ''):

                # ✅ FIX: unpack (service, refreshed_access_token)
                service, new_access_token = build_calendar_service(access_token, refresh_token)

                # ✅ FIX: persist the refreshed token so the next upload also works
                if new_access_token and new_access_token != access_token:
                    user.google_access_token = new_access_token
                    user.save(update_fields=["google_access_token"])

                google_event_id = create_appointment_event(
                    service=service,
                    appointment_datetime=dt,
                    doctor=doctor,
                    parent_email=user.email,
                )
        except Exception as e:
            # Don't fail the whole flow — just skip Calendar
            print(f"Google Calendar skipped: {str(e)}")

    # ✅ Always save to DB regardless of Google Calendar result
    appointment = Appointment.objects.create(
        user=user,
        report=report,
        date_time=dt,
        doctor=doctor,
        source="report",
        google_event_id=google_event_id,
        is_scheduled=True,
    )

    report.is_processed = True
    report.save()

    # Build success message
    scheduled_time = dt.strftime('%d %b %Y at %I:%M %p')
    calendar_note = " and added to Google Calendar" if google_event_id else ""

    return {
        "success": True,
        "appointment_id": appointment.id,
        "google_event_id": google_event_id,
        "message": f"Appointment saved for {scheduled_time}{calendar_note}.",
    }
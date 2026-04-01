from datetime import datetime
from django.utils import timezone
from django.utils.timezone import make_aware

from .extractor import extract_text_from_file
from .ai_extractor import extract_appointment_from_text
from .calendar_service import build_calendar_service, create_appointment_event
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
    After user confirms, actually create the Google Calendar event and save Appointment.
    """
    user = report.user
    dt = datetime.fromisoformat(datetime_iso)

    # Create Google Calendar event
    try:
        service = build_calendar_service(access_token, refresh_token)
        event_id = create_appointment_event(
            service=service,
            appointment_datetime=dt,
            doctor=doctor,
            parent_email=user.email,
        )
    except Exception as e:
        return {"success": False, "error": f"Google Calendar error: {str(e)}"}

    # Save to DB
    appointment = Appointment.objects.create(
        user=user,
        report=report,
        date_time=dt,
        doctor=doctor,
        source="report",
        google_event_id=event_id,
        is_scheduled=True,
    )

    report.is_processed = True
    report.save()

    return {
        "success": True,
        "appointment_id": appointment.id,
        "google_event_id": event_id,
        "message": f"Appointment scheduled on {dt.strftime('%d %b %Y at %I:%M %p')}",
    }
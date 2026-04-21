# backend/apps/reports/views.py

import traceback
import logging

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework import status

from .models import MedicalReport, Appointment, MaternalHealthGuide
from .services.orchestrator import process_report_and_schedule, confirm_and_schedule
from .services.maternal_health_service import generate_maternal_health_guide
from .serializers import AppointmentSerializer, MaternalHealthGuideSerializer
from apps.users.permissions import HasFeaturePermission

logger = logging.getLogger(__name__)


class UploadReportView(APIView):
    permission_classes = [IsAuthenticated, HasFeaturePermission("appointment")]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        try:
            file = request.FILES.get("file")
            if not file:
                return Response({"error": "No file provided."}, status=400)

            allowed_types = ["application/pdf", "image/png", "image/jpeg", "image/tiff"]
            if file.content_type not in allowed_types:
                return Response(
                    {"error": f"Unsupported file type: {file.content_type}. Allowed: PDF, PNG, JPG."},
                    status=400
                )

            report = MedicalReport.objects.create(user=request.user, file=file)
            logger.info(f"Report saved: id={report.id}, file={report.file.name}")

            access_token = getattr(request.user, 'google_access_token', None)
            refresh_token = getattr(request.user, 'google_refresh_token', None)

            result = process_report_and_schedule(report, access_token, refresh_token)
            logger.info(f"Orchestrator result: {result}")

            if not result["success"]:
                return Response({"error": result["error"]}, status=422)

            return Response(result, status=200)

        except AttributeError as e:
            logger.error(f"AttributeError in upload: {traceback.format_exc()}")
            return Response({"error": f"User model missing field: {str(e)}"}, status=500)

        except Exception as e:
            logger.error(f"Unexpected error in upload: {traceback.format_exc()}")
            return Response({"error": f"Server error: {str(e)}"}, status=500)


class ConfirmAppointmentView(APIView):
    permission_classes = [IsAuthenticated, HasFeaturePermission("appointment")]

    def post(self, request):
        try:
            report_id = request.data.get("report_id")
            datetime_iso = request.data.get("datetime_iso")
            doctor = request.data.get("doctor", "")

            if not report_id or not datetime_iso:
                return Response({"error": "report_id and datetime_iso are required."}, status=400)

            try:
                report = MedicalReport.objects.get(id=report_id, user=request.user)
            except MedicalReport.DoesNotExist:
                return Response({"error": "Report not found."}, status=404)

            if report.is_processed:
                return Response({"error": "This report has already been scheduled."}, status=400)

            access_token = getattr(request.user, 'google_access_token', None)
            refresh_token = getattr(request.user, 'google_refresh_token', None)

            result = confirm_and_schedule(report, datetime_iso, doctor, access_token, refresh_token)
            logger.info(f"Confirm result: {result}")

            if not result["success"]:
                return Response({"error": result["error"]}, status=500)

            return Response(result, status=201)

        except Exception as e:
            logger.error(f"Unexpected error in confirm: {traceback.format_exc()}")
            return Response({"error": f"Server error: {str(e)}"}, status=500)


class AppointmentListView(APIView):
    permission_classes = [IsAuthenticated, HasFeaturePermission("appointment")]

    def get(self, request):
        appointments = Appointment.objects.filter(
            user=request.user
        ).order_by("date_time")
        serializer = AppointmentSerializer(appointments, many=True)
        return Response(serializer.data)


class NextAppointmentView(APIView):
    permission_classes = [IsAuthenticated, HasFeaturePermission("appointment")]

    def get(self, request):
        from django.utils import timezone
        appointment = Appointment.objects.filter(
            user=request.user,
            date_time__gte=timezone.now()
        ).order_by("date_time").first()

        if not appointment:
            return Response({"next_appointment": None})

        serializer = AppointmentSerializer(appointment)
        return Response({"next_appointment": serializer.data})


class AppointmentDeleteView(APIView):
    permission_classes = [IsAuthenticated, HasFeaturePermission("appointment")]

    def delete(self, request, pk):
        try:
            appointment = Appointment.objects.get(pk=pk, user=request.user)
        except Appointment.DoesNotExist:
            return Response({"error": "Appointment not found."}, status=404)

        google_event_id = appointment.google_event_id
        if google_event_id:
            try:
                from .services.calendar_service import build_calendar_service, delete_calendar_event
                access_token = getattr(request.user, 'google_access_token', None)
                refresh_token = getattr(request.user, 'google_refresh_token', None)
                if access_token and refresh_token:
                    service, _ = build_calendar_service(access_token, refresh_token)
                    delete_calendar_event(service, google_event_id)
                    logger.info(f"Google Calendar event {google_event_id} deleted.")
            except Exception as e:
                logger.warning(f"Could not delete Google Calendar event: {str(e)}")

        appointment.delete()
        return Response({"message": "Appointment deleted successfully."}, status=200)


# ── NEW ──────────────────────────────────────────────────────────────────────

class MaternalHealthGuideView(APIView):
    """
    POST /reports/health-guide/
    Body (multipart/form-data):
        file      – PDF / image of the medical report
        trimester – (optional) e.g. "First Trimester", "7th month", etc.

    Flow:
    1. Save the MedicalReport (reuses existing model).
    2. Extract text via the existing extractor pipeline.
    3. Call Gemini to generate the maternal health guide JSON.
    4. Save the guide in MaternalHealthGuide.
    5. Return the full guide payload to the frontend.
    """
    permission_classes = [IsAuthenticated, HasFeaturePermission("mental_health_guide")]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        try:
            file = request.FILES.get("file")
            if not file:
                return Response({"error": "No file provided."}, status=400)

            allowed_types = ["application/pdf", "image/png", "image/jpeg", "image/tiff"]
            if file.content_type not in allowed_types:
                return Response(
                    {"error": f"Unsupported file type: {file.content_type}."},
                    status=400,
                )

            trimester = request.data.get("trimester", "").strip()

            # 1. Save the file
            report = MedicalReport.objects.create(user=request.user, file=file)
            logger.info(f"[HealthGuide] Report saved: id={report.id}")

            # 2. Extract text using the existing extractor
            from .services.extractor import extract_text_from_report
            report_text = extract_text_from_report(report)

            if not report_text or len(report_text.strip()) < 30:
                return Response(
                    {"error": "Could not extract readable text from the report. Please upload a clearer file."},
                    status=422,
                )

            # Save extracted text back to the report
            report.extracted_text = report_text
            report.save(update_fields=["extracted_text"])

            # 3. Generate guide via Gemini
            guide_data = generate_maternal_health_guide(report_text, trimester)

            # 4. Persist the guide
            guide = MaternalHealthGuide.objects.create(
                report=report,
                user=request.user,
                trimester=trimester,
                guide_text=guide_data.get("guide_text", ""),
                overall_status=guide_data.get("overall_status", ""),
                positives=guide_data.get("positives", []),
                issues=guide_data.get("issues", []),
                recommendations=guide_data.get("recommendations", {}),
                care_goals=guide_data.get("care_goals", []),
                alerts=guide_data.get("alerts", ""),
            )

            serializer = MaternalHealthGuideSerializer(guide)
            return Response({"success": True, "guide": serializer.data}, status=201)

        except Exception as e:
            logger.error(f"[HealthGuide] Error: {traceback.format_exc()}")
            return Response({"error": f"Server error: {str(e)}"}, status=500)


class MaternalHealthGuideListView(APIView):
    """
    GET /reports/health-guide/history/
    Returns all health guides for the authenticated user, newest first.
    """
    permission_classes = [IsAuthenticated, HasFeaturePermission("mental_health_guide")]

    def get(self, request):
        guides = MaternalHealthGuide.objects.filter(
            user=request.user
        ).order_by("-created_at")
        serializer = MaternalHealthGuideSerializer(guides, many=True)
        return Response(serializer.data)


class MaternalHealthGuideDetailView(APIView):
    """
    GET /reports/health-guide/<int:pk>/
    Returns a single guide by ID (must belong to the authenticated user).
    """
    permission_classes = [IsAuthenticated, HasFeaturePermission("mental_health_guide")]

    def get(self, request, pk):
        try:
            guide = MaternalHealthGuide.objects.get(pk=pk, user=request.user)
        except MaternalHealthGuide.DoesNotExist:
            return Response({"error": "Guide not found."}, status=404)

        serializer = MaternalHealthGuideSerializer(guide)
        return Response(serializer.data)
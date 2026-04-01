import traceback
import logging

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework import status

from .models import MedicalReport, Appointment
from .services.orchestrator import process_report_and_schedule, confirm_and_schedule
from .serializers import AppointmentSerializer

logger = logging.getLogger(__name__)


class UploadReportView(APIView):
    permission_classes = [IsAuthenticated]
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

            # Save the report file
            report = MedicalReport.objects.create(user=request.user, file=file)
            logger.info(f"Report saved: id={report.id}, file={report.file.name}")

            # Google tokens (used later in confirm step)
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
    permission_classes = [IsAuthenticated]

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
    permission_classes = [IsAuthenticated]

    def get(self, request):
        appointments = Appointment.objects.filter(
            user=request.user
        ).order_by("date_time")
        serializer = AppointmentSerializer(appointments, many=True)
        return Response(serializer.data)
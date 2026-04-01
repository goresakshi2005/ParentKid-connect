from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework import status

from .models import MedicalReport, Appointment
from .services.orchestrator import process_report_and_schedule, confirm_and_schedule
from .serializers import AppointmentSerializer


class UploadReportView(APIView):
    """
    POST /api/reports/upload/
    Upload a medical report (PDF or image).
    Extracts text + uses Gemini to detect appointment.
    Returns extracted appointment for user confirmation.
    """
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        file = request.FILES.get("file")
        if not file:
            return Response({"error": "No file provided."}, status=status.HTTP_400_BAD_REQUEST)

        allowed_types = ["application/pdf", "image/png", "image/jpeg", "image/tiff"]
        if file.content_type not in allowed_types:
            return Response({"error": "Unsupported file type."}, status=status.HTTP_400_BAD_REQUEST)

        # Save the report
        report = MedicalReport.objects.create(user=request.user, file=file)

        # Get Google tokens stored on the user model
        access_token = request.user.google_access_token
        refresh_token = request.user.google_refresh_token

        result = process_report_and_schedule(report, access_token, refresh_token)

        if not result["success"]:
            return Response({"error": result["error"]}, status=status.HTTP_422_UNPROCESSABLE_ENTITY)

        return Response(result, status=status.HTTP_200_OK)


class ConfirmAppointmentView(APIView):
    """
    POST /api/reports/confirm/
    User confirms the extracted appointment — schedules it in Google Calendar.

    Body:
    {
      "report_id": 5,
      "datetime_iso": "2026-04-10T11:00:00+05:30",
      "doctor": "Dr. Sharma"
    }
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
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

        access_token = request.user.google_access_token
        refresh_token = request.user.google_refresh_token

        result = confirm_and_schedule(report, datetime_iso, doctor, access_token, refresh_token)

        if not result["success"]:
            return Response({"error": result["error"]}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        return Response(result, status=status.HTTP_201_CREATED)


class AppointmentListView(APIView):
    """
    GET /api/appointments/
    List all scheduled appointments for the logged-in user.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        appointments = Appointment.objects.filter(
            user=request.user
        ).order_by("date_time")
        serializer = AppointmentSerializer(appointments, many=True)
        return Response(serializer.data)
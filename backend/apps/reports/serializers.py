from rest_framework import serializers
from .models import Appointment, MedicalReport


class MedicalReportSerializer(serializers.ModelSerializer):
    class Meta:
        model = MedicalReport
        fields = ["id", "file", "uploaded_at", "is_processed"]


class AppointmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Appointment
        fields = [
            "id",
            "date_time",
            "doctor",
            "notes",
            "source",
            "google_event_id",
            "is_scheduled",
            "created_at",
        ]
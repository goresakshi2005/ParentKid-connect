# backend/apps/reports/serializers.py

from rest_framework import serializers
from .models import Appointment, MedicalReport, MaternalHealthGuide


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


# ── NEW ────────────────────────────────────────────────────────────────────────
class MaternalHealthGuideSerializer(serializers.ModelSerializer):
    class Meta:
        model = MaternalHealthGuide
        fields = [
            "id",
            "report",
            "trimester",
            "guide_text",
            "overall_status",
            "positives",
            "issues",
            "recommendations",
            "care_goals",
            "alerts",
            "created_at",
        ]
        read_only_fields = ["id", "created_at"]
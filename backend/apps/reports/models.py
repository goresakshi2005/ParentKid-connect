# backend/apps/reports/models.py

from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()


class MedicalReport(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='medical_reports')
    file = models.FileField(upload_to='reports/')
    uploaded_at = models.DateTimeField(auto_now_add=True)
    extracted_text = models.TextField(blank=True, null=True)
    is_processed = models.BooleanField(default=False)

    def __str__(self):
        return f"Report by {self.user.username} on {self.uploaded_at.date()}"


class Appointment(models.Model):
    SOURCE_CHOICES = [
        ('report', 'Extracted from Report'),
        ('manual', 'Manually Added'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='appointments')
    report = models.ForeignKey(MedicalReport, on_delete=models.SET_NULL, null=True, blank=True)
    date_time = models.DateTimeField()
    doctor = models.CharField(max_length=100, blank=True)
    notes = models.TextField(blank=True)
    source = models.CharField(max_length=20, choices=SOURCE_CHOICES, default='report')
    google_event_id = models.CharField(max_length=200, blank=True, null=True)
    is_scheduled = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Appointment for {self.user.username} on {self.date_time}"


# ── NEW ────────────────────────────────────────────────────────────────────────
class MaternalHealthGuide(models.Model):
    """
    Stores the AI-generated maternal health guide for a specific MedicalReport.
    One-to-one with MedicalReport so we never duplicate guides for the same upload.
    """
    report = models.OneToOneField(
        MedicalReport,
        on_delete=models.CASCADE,
        related_name='health_guide',
    )
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='health_guides',
    )

    # Optional trimester context supplied by user at upload time
    trimester = models.CharField(max_length=50, blank=True)

    # Full plain-text guide (shown directly in the UI)
    guide_text = models.TextField()

    # Structured breakdown (used to render cards / sections in the UI)
    overall_status = models.TextField(blank=True)
    positives = models.JSONField(default=list)
    issues = models.JSONField(default=list)
    recommendations = models.JSONField(default=dict)
    care_goals = models.JSONField(default=list)
    alerts = models.TextField(blank=True)

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"HealthGuide for {self.user.email} – report #{self.report_id}"
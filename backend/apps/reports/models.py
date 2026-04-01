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
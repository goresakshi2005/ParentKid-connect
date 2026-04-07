# backend/apps/screen_monitor/models.py

from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()


class Device(models.Model):
    """Represents a child's Android device registered by a parent."""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='devices')
    device_name = models.CharField(max_length=100)
    device_id = models.CharField(max_length=255, unique=True)  # Android device ID
    registered_at = models.DateTimeField(auto_now_add=True)
    last_sync = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-registered_at']

    def __str__(self):
        return f"{self.device_name} ({self.user.email})"


class AppUsage(models.Model):
    """Stores per-app screen time usage data uploaded from the Android device."""
    device = models.ForeignKey(Device, on_delete=models.CASCADE, related_name='app_usages')
    app_name = models.CharField(max_length=255)          # e.g. "YouTube"
    package_name = models.CharField(max_length=255)      # e.g. "com.google.android.youtube"
    usage_time = models.PositiveIntegerField()            # in seconds
    date = models.DateField()                             # which day this usage belongs to
    timestamp = models.DateTimeField(auto_now_add=True)  # when it was uploaded

    class Meta:
        ordering = ['-date', '-usage_time']
        # Prevent duplicate entries for same app on same day for same device
        unique_together = ('device', 'package_name', 'date')

    def __str__(self):
        mins = self.usage_time // 60
        return f"{self.app_name} — {mins}m on {self.date}"

    @property
    def usage_minutes(self):
        return round(self.usage_time / 60, 1)
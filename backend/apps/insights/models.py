from django.db import models
from django.contrib.auth import get_user_model
from apps.children.models import Child

User = get_user_model()


class Insight(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='insights')
    title = models.CharField(max_length=200, blank=True)
    content = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Insight for {self.user.email} - {self.created_at}"


class HarmonyReport(models.Model):
    """Persists the full Harmony AI analysis for a parent-child pair."""
    parent = models.ForeignKey(User, on_delete=models.CASCADE, related_name='harmony_reports')
    child = models.ForeignKey(Child, on_delete=models.CASCADE, related_name='harmony_reports')
    analysis_result = models.JSONField()          # Full Harmony AI JSON output
    input_summaries = models.JSONField(default=dict)  # The structured summaries fed to AI
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Harmony Report – {self.child.name} – {self.created_at.date()}"
from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()


class ScreenSession(models.Model):
    """
    Automatically captured screen usage session for a teen user.
    In production, this is populated by the device agent / browser extension.
    For the demo, the frontend simulates real-time session data.
    """
    TIME_OF_DAY_CHOICES = [
        ('morning', 'Morning'),
        ('afternoon', 'Afternoon'),
        ('evening', 'Evening'),
        ('night', 'Night'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='screen_sessions')
    recorded_at = models.DateTimeField(auto_now_add=True)

    # Automatically tracked metrics (minutes)
    total_time = models.PositiveIntegerField(default=0)
    social_time = models.PositiveIntegerField(default=0)
    study_time = models.PositiveIntegerField(default=0)
    continuous_usage = models.PositiveIntegerField(default=0)

    time_of_day = models.CharField(max_length=20, choices=TIME_OF_DAY_CHOICES, default='evening')
    apps_list = models.JSONField(default=list)  # ["Instagram", "YouTube", "Khan Academy"]

    class Meta:
        ordering = ['-recorded_at']

    def __str__(self):
        return f"{self.user.email} | {self.recorded_at.date()} | {self.total_time}min"


class BehaviorAnalysis(models.Model):
    """
    AI-generated analysis result for a ScreenSession.
    Auto-triggered after each session is logged.
    """
    DETECTED_STATE_CHOICES = [
        ('normal', 'Normal'),
        ('stressed', 'Stressed'),
        ('fatigued', 'Fatigued'),
        ('distracted', 'Distracted'),
        ('overuse', 'Overuse'),
    ]
    INTENSITY_CHOICES = [('low', 'Low'), ('medium', 'Medium'), ('high', 'High')]
    RISK_CHOICES = [('none', 'None'), ('low', 'Low'), ('medium', 'Medium'), ('high', 'High')]
    ACTION_CHOICES = [('focus_mode', 'Focus Mode'), ('digital_detox', 'Digital Detox'), ('rest_mode', 'Rest Mode'), ('none', 'None')]
    PARENT_ALERT_CHOICES = [('none', 'None'), ('consider', 'Consider'), ('required', 'Required')]

    session = models.OneToOneField(ScreenSession, on_delete=models.CASCADE, related_name='analysis')
    analyzed_at = models.DateTimeField(auto_now_add=True)

    detected_state = models.CharField(max_length=20, choices=DETECTED_STATE_CHOICES, default='normal')
    intensity = models.CharField(max_length=10, choices=INTENSITY_CHOICES, default='low')
    confidence = models.FloatField(default=0.5)
    behavior_pattern = models.TextField(blank=True)
    risk_level = models.CharField(max_length=10, choices=RISK_CHOICES, default='none')

    # Auto-action
    action_type = models.CharField(max_length=20, choices=ACTION_CHOICES, default='none')
    action_description = models.TextField(blank=True)
    action_duration = models.CharField(max_length=50, blank=True)

    system_changes = models.JSONField(default=list)
    user_message = models.TextField(blank=True)
    parent_alert = models.CharField(max_length=10, choices=PARENT_ALERT_CHOICES, default='none')

    # Raw JSON from AI
    raw_result = models.JSONField(default=dict)

    class Meta:
        ordering = ['-analyzed_at']

    def __str__(self):
        return f"{self.session.user.email} | {self.detected_state} ({self.intensity})"
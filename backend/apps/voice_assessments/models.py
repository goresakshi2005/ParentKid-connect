from django.db import models
from django.contrib.auth import get_user_model
import uuid

User = get_user_model()

class VoiceAssessmentSession(models.Model):
    STATUS_CHOICES = (
        ('in_progress', 'In Progress'),
        ('completed', 'Completed'),
    )
    session_id = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='voice_sessions')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='in_progress')
    conversation_history = models.JSONField(default=list)  # list of {question, answer_text, answer_audio_path, vocal_features}
    stress_score = models.IntegerField(null=True, blank=True)
    confidence_score = models.IntegerField(null=True, blank=True)
    fatigue_score = models.IntegerField(null=True, blank=True)
    stress_level = models.CharField(max_length=10, blank=True)
    insights = models.JSONField(default=list)
    recommendations = models.JSONField(default=list)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Session {self.session_id} - {self.user.email}"
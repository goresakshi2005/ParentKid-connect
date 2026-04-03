from rest_framework import serializers
from .models import VoiceAssessmentSession

class StartSessionSerializer(serializers.Serializer):
    pass  # no fields needed

class RespondSerializer(serializers.Serializer):
    session_id = serializers.UUIDField()
    audio = serializers.FileField()

class VoiceResultSerializer(serializers.ModelSerializer):
    class Meta:
        model = VoiceAssessmentSession
        fields = [
            'session_id', 'status',
            'stress_score', 'confidence_score', 'fatigue_score',
            'stress_level', 'insights', 'recommendations',
            'updated_at',   # ← used by the dashboard card to show "Last checked on …"
        ]
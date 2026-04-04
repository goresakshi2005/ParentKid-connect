from rest_framework import serializers
from .models import StudyTask


class StudyTaskSerializer(serializers.ModelSerializer):
    class Meta:
        model = StudyTask
        fields = [
            'id', 'title', 'task_type', 'date', 'time',
            'deadline', 'reminder', 'priority', 'status',
            'voice_input', 'parsed_json', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class VoiceInputSerializer(serializers.Serializer):
    """Accepts a raw voice-to-text string and returns structured JSON."""
    voice_text = serializers.CharField()
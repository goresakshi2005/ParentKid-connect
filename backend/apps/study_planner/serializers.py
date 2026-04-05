from rest_framework import serializers
from .models import StudyTask


class StudyTaskSerializer(serializers.ModelSerializer):
    class Meta:
        model = StudyTask
        fields = [
            'id', 'title', 'task_type', 'date', 'time',
            'deadline', 'reminder', 'priority', 'status',
            'voice_input', 'parsed_json', 'created_at', 'updated_at',
            'google_calendar_event_id',   # <-- added
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'google_calendar_event_id']


class VoiceInputSerializer(serializers.Serializer):
    voice_text = serializers.CharField()
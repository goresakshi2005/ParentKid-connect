from rest_framework import serializers
from .models import ScreenSession, BehaviorAnalysis


class BehaviorAnalysisSerializer(serializers.ModelSerializer):
    class Meta:
        model = BehaviorAnalysis
        fields = [
            'id', 'analyzed_at', 'detected_state', 'intensity', 'confidence',
            'behavior_pattern', 'risk_level', 'action_type', 'action_description',
            'action_duration', 'system_changes', 'user_message', 'parent_alert',
        ]


class ScreenSessionSerializer(serializers.ModelSerializer):
    analysis = BehaviorAnalysisSerializer(read_only=True)

    class Meta:
        model = ScreenSession
        fields = [
            'id', 'recorded_at', 'total_time', 'social_time', 'study_time',
            'continuous_usage', 'time_of_day', 'apps_list', 'analysis',
        ]
        read_only_fields = ['recorded_at']


class ScreenSessionCreateSerializer(serializers.ModelSerializer):
    """Used when the device agent POSTs a new session."""
    class Meta:
        model = ScreenSession
        fields = [
            'total_time', 'social_time', 'study_time',
            'continuous_usage', 'time_of_day', 'apps_list',
        ]
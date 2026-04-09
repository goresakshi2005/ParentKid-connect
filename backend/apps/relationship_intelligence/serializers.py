from rest_framework import serializers
from .models import RelationshipState, MoodCheckIn, InteractionLog, ParentActionFeedback, BehaviorSignal

class RelationshipStateSerializer(serializers.ModelSerializer):
    class Meta:
        model = RelationshipState
        fields = '__all__'

class MoodCheckInSerializer(serializers.ModelSerializer):
    class Meta:
        model = MoodCheckIn
        fields = ['id', 'user', 'child', 'mood', 'notes', 'timestamp']
        read_only_fields = ['id', 'user', 'timestamp']

class InteractionLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = InteractionLog
        fields = '__all__'

class ParentActionFeedbackSerializer(serializers.ModelSerializer):
    class Meta:
        model = ParentActionFeedback
        fields = '__all__'

class BehaviorSignalSerializer(serializers.ModelSerializer):
    class Meta:
        model = BehaviorSignal
        fields = '__all__'
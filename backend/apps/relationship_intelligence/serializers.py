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

# backend/apps/relationship_intelligence/serializers.py

from rest_framework import serializers
from .models import RelationshipState, MoodCheckIn, InteractionLog, ParentActionFeedback, BehaviorSignal, RelationshipAnalysis

# ... existing serializers ...

class RelationshipAnalysisSerializer(serializers.ModelSerializer):
    child_name = serializers.CharField(source='child.name', read_only=True)
    
    class Meta:
        model = RelationshipAnalysis
        fields = [
            'id', 'parent', 'child', 'child_name',
            'parent_input', 'child_input', 'analysis_result', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']

from .models import MagicFixHistory

class MagicFixHistorySerializer(serializers.ModelSerializer):
    child_name = serializers.CharField(source='child.name', read_only=True)

    class Meta:
        model = MagicFixHistory
        fields = [
            'id', 'parent', 'child', 'child_name',
            'problem', 'behavior', 'mood', 'context',
            'fix_result', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']
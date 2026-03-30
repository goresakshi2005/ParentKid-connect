from rest_framework import serializers
from .models import Assessment, AssessmentResult
from apps.children.serializers import ChildSerializer

class AssessmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Assessment
        fields = ['id', 'assessment_type', 'stage', 'title', 'description', 'questions', 'created_at']

class AssessmentResultSerializer(serializers.ModelSerializer):
    child = ChildSerializer(read_only=True)
    assessment_title = serializers.CharField(source='assessment.title', read_only=True)
    
    class Meta:
        model = AssessmentResult
        fields = [
            'id', 'assessment', 'assessment_title', 'user', 'child',
            'health_score', 'behavior_score', 'routine_score', 'emotional_score',
            'final_score', 'weighted_score', 'risk_level',
            'strengths', 'improvements', 'recommendations', 'created_at'
        ]
from rest_framework import serializers
from .models import Assessment, AssessmentResult, CareerDiscoveryResult
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

class CareerDiscoveryResultSerializer(serializers.ModelSerializer):
    child_details = ChildSerializer(source='child', read_only=True)
    
    class Meta:
        model = CareerDiscoveryResult
        fields = [
            'id', 'user', 'child', 'child_details',
            'trait_labels', 'scores', 'best_career_title', 
            'best_career_emoji', 'best_career_why', 'alternatives',
            'created_at', 'updated_at'
        ]
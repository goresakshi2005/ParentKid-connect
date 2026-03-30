from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q
from .models import Assessment, AssessmentResult
from .serializers import AssessmentSerializer, AssessmentResultSerializer
from .scoring import AssessmentScorer
from apps.children.models import Child

class AssessmentViewSet(viewsets.ModelViewSet):
    queryset = Assessment.objects.all()
    serializer_class = AssessmentSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        stage = self.request.query_params.get('stage', '')
        assessment_type = self.request.query_params.get('type', '')
        
        queryset = Assessment.objects.all()
        
        if assessment_type:
            queryset = queryset.filter(assessment_type=assessment_type)
        
        if stage:
            queryset = queryset.filter(stage=stage)
        
        return queryset.order_by('-created_at')
    
    @action(detail=False, methods=['post'])
    def submit_assessment(self, request):
        try:
            assessment_id = request.data.get('assessment_id')
            answers = request.data.get('answers', [])
            child_id = request.data.get('child_id')
            
            assessment = Assessment.objects.get(id=assessment_id)
            
            if child_id:
                child = Child.objects.get(id=child_id, parent=request.user)
                user = None
            else:
                child = None
                user = request.user
            
            scorer = AssessmentScorer(answers, assessment.questions)
            report = scorer.get_complete_report(assessment.assessment_type)
            
            result = AssessmentResult.objects.create(
                assessment=assessment,
                user=user,
                child=child,
                health_score=report['health_score'],
                behavior_score=report['behavior_score'],
                routine_score=report['routine_score'],
                emotional_score=report['emotional_score'],
                final_score=report['final_score'],
                weighted_score=report['weighted_score'],
                risk_level=report['risk_level'],
                answers=answers,
                strengths=report['strengths'],
                improvements=report['improvements'],
                recommendations=report['recommendations'],
            )
            
            serializer = AssessmentResultSerializer(result)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        
        except Assessment.DoesNotExist:
            return Response({'error': 'Assessment not found'}, 
                          status=status.HTTP_404_NOT_FOUND)
        except Child.DoesNotExist:
            return Response({'error': 'Child not found'}, 
                          status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({'error': str(e)}, 
                          status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['get'])
    def my_results(self, request):
        user = request.user
        
        if user.role == 'parent':
            child_ids = Child.objects.filter(parent=user).values_list('id', flat=True)
            results = AssessmentResult.objects.filter(
                Q(user=user) | Q(child_id__in=child_ids)
            )
        else:
            results = AssessmentResult.objects.filter(user=user)
        
        serializer = AssessmentResultSerializer(results, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def progress_tracking(self, request):
        child_id = request.query_params.get('child_id')
        user = request.user
        
        if child_id:
            try:
                child = Child.objects.get(id=child_id, parent=user)
                results = AssessmentResult.objects.filter(child=child).order_by('created_at')
            except Child.DoesNotExist:
                return Response({'error': 'Child not found'}, 
                              status=status.HTTP_404_NOT_FOUND)
        else:
            results = AssessmentResult.objects.filter(user=user).order_by('created_at')
        
        data = {
            'progress': AssessmentResultSerializer(results, many=True).data,
            'latest_score': results.last().final_score if results.exists() else 0,
            'previous_score': results[len(results)-2].final_score if len(results) >= 2 else 0,
        }
        
        return Response(data)
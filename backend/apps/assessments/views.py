# backend/apps/assessments/views.py

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q
from .models import Assessment, AssessmentResult, CareerDiscoveryResult
from .serializers import AssessmentSerializer, AssessmentResultSerializer, CareerDiscoveryResultSerializer
from .scoring import AssessmentScorer
from apps.children.models import Child

class AssessmentViewSet(viewsets.ModelViewSet):
    queryset = Assessment.objects.all()
    serializer_class = AssessmentSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
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
            return Response({'error': 'Assessment not found'}, status=404)
        except Child.DoesNotExist:
            return Response({'error': 'Child not found'}, status=404)
        except Exception as e:
            return Response({'error': str(e)}, status=400)
    
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
                return Response({'error': 'Child not found'}, status=404)
        else:
            results = AssessmentResult.objects.filter(user=user).order_by('created_at')
        
        data = {
            'progress': AssessmentResultSerializer(results, many=True).data,
            'latest_score': results.last().final_score if results.exists() else 0,
            'previous_score': results[len(results)-2].final_score if len(results) >= 2 else 0,
        }
        return Response(data)

    @action(detail=False, methods=['get'])
    def recommended(self, request):
        user = request.user
        child_id = request.query_params.get('child_id')
        tier = request.query_params.get('tier', 'free')
        assessment_type = request.query_params.get('type')

        if not assessment_type:
            return Response({'error': 'type parameter is required'}, status=400)

        # Determine stage based on child for 'child' assessments
        if assessment_type == 'child' and child_id:
            try:
                child = Child.objects.get(id=child_id, parent=user)
                stage = child.stage
            except Child.DoesNotExist:
                return Response({'error': 'Child not found'}, status=404)
        elif assessment_type == 'parent':
            first_child = Child.objects.filter(parent=user).first()
            stage = first_child.stage if first_child else 'pregnancy'
        else:  # teen
            stage = 'teen_age'

        # Try exact match (type + stage + tier)
        assessment = Assessment.objects.filter(
            assessment_type=assessment_type,
            stage=stage,
            tier=tier
        ).order_by('-created_at').first()

        # Fallback to any tier (same type + stage)
        if not assessment:
            assessment = Assessment.objects.filter(
                assessment_type=assessment_type,
                stage=stage
            ).order_by('-created_at').first()

        # Final fallback to any stage (same type)
        if not assessment:
            assessment = Assessment.objects.filter(
                assessment_type=assessment_type
            ).order_by('-created_at').first()

        if not assessment:
            return Response({'error': f'No assessment available for {assessment_type}. Please contact support.'}, status=404)

        serializer = AssessmentSerializer(assessment)
        return Response(serializer.data)

class CareerDiscoveryViewSet(viewsets.ModelViewSet):
    queryset = CareerDiscoveryResult.objects.all()
    serializer_class = CareerDiscoveryResultSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        if user.role == 'parent':
            child_ids = Child.objects.filter(parent=user).values_list('id', flat=True)
            return CareerDiscoveryResult.objects.filter(Q(user=user) | Q(child__in=child_ids))
        return CareerDiscoveryResult.objects.filter(user=user)
        
    def create(self, request, *args, **kwargs):
        data = request.data
        child_id = data.get('child_id')
        user = request.user
        
        child = None
        if child_id:
            try:
                child = Child.objects.get(id=child_id, parent=user)
                user = None
            except Child.DoesNotExist:
                return Response({'error': 'Child not found'}, status=404)
                
        best_career_title = data.get('best_career_title', '')
        best_career_emoji = data.get('best_career_emoji', '')
        best_career_why = data.get('best_career_why', '')
        task = ''
        alternatives = data.get('alternatives', [])
        
        # Call AI if not fully provided (or force AI generation)
        if not best_career_title or not best_career_why:
            from .scoring import CareerDiscoveryEngine
            ai_results = CareerDiscoveryEngine.generate_career_path(
                trait_labels=data.get('trait_labels', []),
                scores=data.get('scores', {})
            )
            if ai_results:
                best_career_title = ai_results.get('best_career_title', best_career_title)
                best_career_emoji = ai_results.get('best_career_emoji', best_career_emoji)
                best_career_why = ai_results.get('best_career_why', best_career_why)
                task = ai_results.get('task', '')
                alternatives = ai_results.get('alternatives', alternatives)

        result = CareerDiscoveryResult.objects.create(
            user=user,
            child=child,
            trait_labels=data.get('trait_labels', []),
            scores=data.get('scores', {}),
            best_career_title=best_career_title,
            best_career_emoji=best_career_emoji,
            best_career_why=best_career_why,
            task=task,
            alternatives=alternatives
        )
        
        serializer = self.get_serializer(result)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
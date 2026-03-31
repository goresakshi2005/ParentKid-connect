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
            
            print(f"🔍 Submit assessment - ID: {assessment_id}, Child: {child_id}, Answers count: {len(answers)}")
            
            assessment = Assessment.objects.get(id=assessment_id)
            print(f"✅ Assessment loaded: {assessment.title}")
            
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
            print("❌ Assessment not found")
            return Response({'error': 'Assessment not found'}, status=404)
        except Child.DoesNotExist:
            print("❌ Child not found")
            return Response({'error': 'Child not found'}, status=404)
        except Exception as e:
            print(f"❌ Error: {str(e)}")
            import traceback
            traceback.print_exc()
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

        # Determine stage
        if assessment_type == 'child' and child_id:
            child = Child.objects.get(id=child_id, parent=user)
            stage = child.stage
            print(f"🔍 Child assessment requested: stage={stage}, tier={tier}")
        elif assessment_type == 'parent':
            first_child = Child.objects.filter(parent=user).first()
            stage = first_child.stage if first_child else 'pregnancy'
            print(f"🔍 Parent assessment requested: stage={stage}, tier={tier}")
        else:  # teen
            stage = 'teen_age'
            print(f"🔍 Teen assessment requested: stage={stage}, tier={tier}")

        # Try to find exact match
        assessment = Assessment.objects.filter(
            assessment_type=assessment_type,
            stage=stage,
            tier=tier
        ).order_by('-created_at').first()

        # If not found, try to find any assessment for that type and stage (ignore tier)
        if not assessment:
            print(f"⚠️ No {tier} assessment found for {assessment_type} at stage {stage}. Looking for any tier...")
            assessment = Assessment.objects.filter(
                assessment_type=assessment_type,
                stage=stage
            ).order_by('-created_at').first()

        # If still not found, try to find any assessment for that type (any stage)
        if not assessment:
            print(f"⚠️ No assessment found for {assessment_type} at stage {stage}. Using any available.")
            assessment = Assessment.objects.filter(
                assessment_type=assessment_type
            ).order_by('-created_at').first()

        if not assessment:
            return Response({'error': f'No assessment available for {assessment_type}. Please contact support.'}, status=404)

        serializer = AssessmentSerializer(assessment)
        return Response(serializer.data)
# backend/apps/relationship_intelligence/views.py

from rest_framework import status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404
from .services.ai_engine import RelationshipIntelligenceEngine
from .models import RelationshipAnalysis, Child
from .serializers import RelationshipAnalysisSerializer

from apps.users.permissions import HasFeaturePermission

class RelationshipAnalysisView(APIView):
    permission_classes = [permissions.IsAuthenticated, HasFeaturePermission("relationship_ai")]

    def post(self, request):
        parent_data = request.data.get('parent', {})
        child_data = request.data.get('child', {})
        child_id = request.data.get('child_id')  # <-- we need child_id to save

        if not parent_data or not child_data:
            return Response(
                {"error": "Both parent and child data are required"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Ensure child exists and belongs to this parent
        child = None
        if child_id:
            child = get_object_or_404(Child, id=child_id, parent=request.user)
        else:
            return Response(
                {"error": "child_id is required"},
                status=status.HTTP_400_BAD_REQUEST
            )

        analysis = RelationshipIntelligenceEngine.analyze_communication(parent_data, child_data)
        
        if "error" in analysis:
            return Response(analysis, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        # Save the analysis to database
        saved = RelationshipAnalysis.objects.create(
            parent=request.user,
            child=child,
            parent_input=parent_data,
            child_input=child_data,
            analysis_result=analysis
        )
        
        # Return the analysis along with the saved record ID
        return Response({
            "analysis": analysis,
            "saved_id": saved.id,
            "created_at": saved.created_at
        }, status=status.HTTP_200_OK)


class RelationshipHistoryView(APIView):
    permission_classes = [permissions.IsAuthenticated, HasFeaturePermission("relationship_ai")]
    
    def get(self, request, child_id):
        child = get_object_or_404(Child, id=child_id, parent=request.user)
        analyses = RelationshipAnalysis.objects.filter(child=child).order_by('-created_at')
        serializer = RelationshipAnalysisSerializer(analyses, many=True)
        return Response(serializer.data)


class MagicFixView(APIView):
    permission_classes = [permissions.IsAuthenticated, HasFeaturePermission("magic_fix")]

    def post(self, request):
        child_id = request.data.get('child_id')
        problem = request.data.get('problem', '')
        behavior = request.data.get('behavior', '')
        mood = request.data.get('mood', 'normal')
        context = request.data.get('context', '')
        
        if not child_id:
            return Response({"error": "child_id is required"}, status=status.HTTP_400_BAD_REQUEST)

        child = get_object_or_404(Child, id=child_id, parent=request.user)
        age = child.get_age()

        # import here to avoid circular imports if any, or we can import at top
        from .services.ai_engine import MagicFixEngine
        
        result = MagicFixEngine.get_magic_fix(problem, behavior, age, mood, context)
        
        if "error" in result:
            return Response(result, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
        from .models import MagicFixHistory
        saved_fix = MagicFixHistory.objects.create(
            parent=request.user,
            child=child,
            problem=problem,
            behavior=behavior,
            mood=mood,
            context=context,
            fix_result=result
        )
            
        return Response({
            "magic_fix": result,
            "saved_id": saved_fix.id,
            "created_at": saved_fix.created_at
        }, status=status.HTTP_200_OK)

class MagicFixHistoryListView(APIView):
    permission_classes = [permissions.IsAuthenticated, HasFeaturePermission("magic_fix")]
    
    def get(self, request, child_id):
        child = get_object_or_404(Child, id=child_id, parent=request.user)
        from .models import MagicFixHistory
        from .serializers import MagicFixHistorySerializer
        
        history = MagicFixHistory.objects.filter(child=child).order_by('-created_at')
        serializer = MagicFixHistorySerializer(history, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class BondBridgeView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        child_id = request.data.get('child_id')
        teen_mood = request.data.get('teen_mood', 'okay')
        teen_thought = request.data.get('teen_thought', '')
        parent_mood = request.data.get('parent_mood', 'calm')
        parent_thought = request.data.get('parent_thought', '')
        context = request.data.get('context', '')

        # Handle both parent and teen roles for verification
        if request.user.role == 'parent':
            if not child_id:
                return Response({"error": "child_id is required for parents"}, status=status.HTTP_400_BAD_REQUEST)
            child = get_object_or_404(Child, id=child_id, parent=request.user)
        elif request.user.role == 'teen':
            # Teens are mapped to their Child profile via email
            child = Child.objects.filter(email=request.user.email).first()
            if not child:
                return Response({"error": "Child profile not found for this teen account."}, status=status.HTTP_404_NOT_FOUND)
        else:
            return Response({"error": "Only parents and teens can use BondBridge."}, status=status.HTTP_403_FORBIDDEN)

        from .services.ai_engine import BondBridgeEngine
        
        result = BondBridgeEngine.get_bond_bridge(teen_mood, teen_thought, parent_mood, parent_thought, context)
        
        if "error" in result:
            return Response(result, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
        return Response({
            "bond_bridge": result
        }, status=status.HTTP_200_OK)
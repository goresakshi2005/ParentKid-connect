from rest_framework import status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from .services.ai_engine import RelationshipIntelligenceEngine

class RelationshipAnalysisView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        parent_data = request.data.get('parent', {})
        child_data = request.data.get('child', {})

        if not parent_data or not child_data:
            return Response(
                {"error": "Both parent and child data are required"},
                status=status.HTTP_400_BAD_REQUEST
            )

        analysis = RelationshipIntelligenceEngine.analyze_communication(parent_data, child_data)
        
        if "error" in analysis:
            return Response(analysis, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
        return Response(analysis, status=status.HTTP_200_OK)

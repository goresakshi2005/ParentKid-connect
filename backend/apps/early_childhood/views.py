from rest_framework import status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404
from .services.ai_engine import EarlyChildhoodAIEngine
from .models import EarlyChildhoodReport
from apps.children.models import Child
from .serializers import EarlyChildhoodReportSerializer

class EarlyChildhoodAnalysisView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        data = request.data
        child_id = data.get('child_id')

        if not child_id:
            return Response({"error": "child_id is required"}, status=status.HTTP_400_BAD_REQUEST)

        child = get_object_or_404(Child, id=child_id, parent=request.user)

        # Get historical data if available
        last_report = EarlyChildhoodReport.objects.filter(child=child).order_by('-created_at').first()
        historical_data = None
        if last_report and last_report.analysis_result:
            historical_data = {
                'prev_status': last_report.analysis_result.get('current_status', 'Unknown'),
                'prev_problems': last_report.problem_selected,
                'prev_followed': 'Unknown',
                'progress_trend': 'Unknown'
            }

        analysis = EarlyChildhoodAIEngine.analyze_childhood_data(data, historical_data)

        if "error" in analysis:
            return Response(analysis, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        # Save report
        report = EarlyChildhoodReport.objects.create(
            child=child,
            parent=request.user,
            age=data.get('age'),
            gender=data.get('gender', ''),
            weight=data.get('weight'),
            height=data.get('height'),
            speech_status=data.get('speech_status', ''),
            response_name=data.get('response_name', ''),
            eye_contact=data.get('eye_contact', ''),
            motor_skills=data.get('motor_skills', ''),
            social_behavior=data.get('social_behavior', ''),
            eating_habit=data.get('eating_habit', ''),
            sleep_hours=data.get('sleep_hours'),
            screen_time=data.get('screen_time'),
            problem_selected=data.get('problem_selected', ''),
            parent_text=data.get('parent_text', ''),
            input_confidence=data.get('input_confidence', ''),
            analysis_result=analysis
        )

        return Response({
            "analysis": analysis,
            "saved_id": report.id,
            "created_at": report.created_at
        }, status=status.HTTP_200_OK)


class EarlyChildhoodHistoryView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, child_id):
        child = get_object_or_404(Child, id=child_id, parent=request.user)
        reports = EarlyChildhoodReport.objects.filter(child=child)
        serializer = EarlyChildhoodReportSerializer(reports, many=True)
        return Response(serializer.data)

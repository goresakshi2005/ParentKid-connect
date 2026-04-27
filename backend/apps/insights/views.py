from rest_framework import viewsets, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404

from .models import Insight, HarmonyReport
from .serializers import InsightSerializer
from .harmony_ai_service import HarmonyAIEngine

from apps.children.models import Child
from apps.screen_monitor.ai_service import ScreenTimeIntelligenceEngine
from apps.utils.firebase_helper import FirebaseHelper
from apps.screen_monitor.models import Device, AppUsage
from apps.voice_assessments.models import VoiceAssessmentSession
from apps.assessments.models import AssessmentResult
from apps.relationship_intelligence.models import RelationshipAnalysis

import logging

logger = logging.getLogger(__name__)


class InsightViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = InsightSerializer

    def get_queryset(self):
        # For future implementation
        return Insight.objects.none()


class HarmonyAIView(APIView):
    """
    GET /api/insights/harmony-ai/?child_id=<id>
    Aggregates data from all subsystems, calls the Harmony AI engine,
    and returns actionable parenting intelligence.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        child_id = request.query_params.get('child_id')
        if not child_id:
            return Response({'error': 'child_id is required.'}, status=status.HTTP_400_BAD_REQUEST)

        child = get_object_or_404(Child, id=child_id, parent=request.user)

        # ─── 1. Screen Time Data ───────────────────────────────────────
        screen_data = self._get_screen_data(request.user, child)

        # ─── 2. Voice Emotion Data ─────────────────────────────────────
        voice_data = self._get_voice_data(request.user)

        # ─── 3. Assessment Data ────────────────────────────────────────
        assessment_data = self._get_assessment_data(request.user, child)

        # ─── 4. Relationship Data ──────────────────────────────────────
        relationship_data = self._get_relationship_data(request.user, child)

        # ─── 5. Call Harmony AI Engine ─────────────────────────────────
        result = HarmonyAIEngine.generate_harmony_report(
            screen_data=screen_data,
            voice_data=voice_data,
            assessment_data=assessment_data,
            relationship_data=relationship_data,
        )

        if "error" in result:
            return Response(result, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        # ─── 6. Persist the report ─────────────────────────────────────
        meta = result.pop("_meta", {})
        try:
            HarmonyReport.objects.create(
                parent=request.user,
                child=child,
                analysis_result=result,
                input_summaries=meta,
            )
        except Exception as e:
            logger.warning(f"Could not persist Harmony Report: {e}")

        # Add child context
        result["child_name"] = child.name
        result["child_age"] = child.get_age()

        return Response(result, status=status.HTTP_200_OK)

    # ─── Helper Methods ────────────────────────────────────────────────

    def _get_screen_data(self, user, child):
        """Fetches screen intelligence data from Firebase or local DB."""
        try:
            apps_dict = {}
            if child.email:
                firebase_data = FirebaseHelper.fetch_screen_time(child.email)
                if firebase_data:
                    apps_dict = firebase_data

            if not apps_dict and child.firebase_id:
                firebase_data = FirebaseHelper.fetch_screen_time(child.firebase_id)
                if firebase_data:
                    apps_dict = firebase_data

            if not apps_dict:
                devices = Device.objects.filter(user=user)
                from datetime import date, timedelta
                today = date.today()
                usage_data = AppUsage.objects.filter(
                    device__in=devices, date__gte=today - timedelta(days=1)
                )
                for u in usage_data:
                    if u.app_name not in apps_dict:
                        apps_dict[u.app_name] = 0
                    apps_dict[u.app_name] += u.usage_minutes

            if apps_dict:
                analysis = ScreenTimeIntelligenceEngine.analyze_usage(
                    child_name=child.name,
                    age=child.get_age(),
                    apps_data=apps_dict,
                )
                return analysis if isinstance(analysis, dict) and "error" not in analysis else None
        except Exception as e:
            logger.warning(f"Screen data fetch failed: {e}")
        return None

    def _get_voice_data(self, user):
        """Fetches latest completed voice assessment."""
        try:
            session = (
                VoiceAssessmentSession.objects
                .filter(user=user, status='completed')
                .order_by('-updated_at')
                .first()
            )
            if session:
                return {
                    "stress_score": session.stress_score,
                    "confidence_score": session.confidence_score,
                    "fatigue_score": session.fatigue_score,
                    "stress_level": session.stress_level,
                    "insights": session.insights or [],
                    "recommendations": session.recommendations or [],
                }
        except Exception as e:
            logger.warning(f"Voice data fetch failed: {e}")
        return None

    def _get_assessment_data(self, user, child):
        """Fetches latest assessment result for the child."""
        try:
            result = (
                AssessmentResult.objects
                .filter(child=child)
                .order_by('-created_at')
                .first()
            )
            if not result:
                # Fallback to parent's own assessment
                result = (
                    AssessmentResult.objects
                    .filter(user=user, child__isnull=True)
                    .order_by('-created_at')
                    .first()
                )
            if result:
                return {
                    "final_score": result.final_score,
                    "risk_level": result.risk_level,
                    "health_score": result.health_score,
                    "behavior_score": result.behavior_score,
                    "emotional_score": result.emotional_score,
                    "routine_score": result.routine_score,
                    "strengths": result.strengths or [],
                    "improvements": result.improvements or [],
                    "recommendations": result.recommendations or [],
                }
        except Exception as e:
            logger.warning(f"Assessment data fetch failed: {e}")
        return None

    def _get_relationship_data(self, user, child):
        """Fetches latest relationship analysis for the child."""
        try:
            analysis = (
                RelationshipAnalysis.objects
                .filter(parent=user, child=child)
                .order_by('-created_at')
                .first()
            )
            if analysis:
                return {
                    "parent_input": analysis.parent_input,
                    "child_input": analysis.child_input,
                    "analysis_result": analysis.analysis_result,
                }
        except Exception as e:
            logger.warning(f"Relationship data fetch failed: {e}")
        return None


class HarmonyHistoryView(APIView):
    """
    GET /api/insights/harmony-ai/history/<int:child_id>/
    Returns all past Harmony AI reports for a child, newest first.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, child_id):
        child = get_object_or_404(Child, id=child_id, parent=request.user)
        reports = HarmonyReport.objects.filter(parent=request.user, child=child)[:10]

        data = []
        for r in reports:
            entry = r.analysis_result
            entry["id"] = r.id
            entry["created_at"] = r.created_at.isoformat()
            entry["child_name"] = child.name
            data.append(entry)

        return Response(data, status=status.HTTP_200_OK)
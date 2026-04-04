"""
screen_monitor/views.py

Endpoints:
  POST /screen-monitor/session/   – device agent logs a new session (auto-triggers AI)
  GET  /screen-monitor/sessions/  – teen/parent fetches session history + analyses
  GET  /screen-monitor/latest/    – latest analysis for the logged-in teen
  GET  /screen-monitor/summary/   – aggregated weekly summary
"""
from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .ai_service import analyze_session
from .models import BehaviorAnalysis, ScreenSession
from .serializers import (
    BehaviorAnalysisSerializer,
    ScreenSessionCreateSerializer,
    ScreenSessionSerializer,
)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def log_session(request):
    """
    Called automatically by the device agent / browser extension.
    Creates a ScreenSession, runs AI analysis, stores BehaviorAnalysis.
    """
    serializer = ScreenSessionCreateSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    session = serializer.save(user=request.user)

    # Fetch recent sessions for context (last 5, excluding this one)
    recent_qs = (
        ScreenSession.objects
        .filter(user=request.user)
        .exclude(pk=session.pk)
        .prefetch_related('analysis')
        .order_by('-recorded_at')[:5]
    )
    recent_logs = []
    for s in recent_qs:
        entry = {
            'recorded_at': s.recorded_at.isoformat(),
            'total_time': s.total_time,
            'social_time': s.social_time,
            'study_time': s.study_time,
            'continuous_usage': s.continuous_usage,
            'time_of_day': s.time_of_day,
        }
        if hasattr(s, 'analysis'):
            entry['detected_state'] = s.analysis.detected_state
        recent_logs.append(entry)

    # Run AI analysis
    session_data = {
        'total_time': session.total_time,
        'social_time': session.social_time,
        'study_time': session.study_time,
        'continuous_usage': session.continuous_usage,
        'time_of_day': session.time_of_day,
        'apps_list': session.apps_list,
    }
    result = analyze_session(session_data, recent_logs)

    auto_action = result.get('auto_action', {})
    BehaviorAnalysis.objects.create(
        session=session,
        detected_state=result.get('detected_state', 'normal'),
        intensity=result.get('intensity', 'low'),
        confidence=result.get('confidence', 0.5),
        behavior_pattern=result.get('behavior_pattern', ''),
        risk_level=result.get('risk_level', 'none'),
        action_type=auto_action.get('action_type', 'none'),
        action_description=auto_action.get('description', ''),
        action_duration=auto_action.get('duration', ''),
        system_changes=result.get('system_changes', []),
        user_message=result.get('user_message', ''),
        parent_alert=result.get('parent_alert', 'none'),
        raw_result=result,
    )

    return Response(ScreenSessionSerializer(session).data, status=status.HTTP_201_CREATED)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_sessions(request):
    """Return last 20 sessions with analyses for the logged-in teen."""
    sessions = (
        ScreenSession.objects
        .filter(user=request.user)
        .prefetch_related('analysis')
        .order_by('-recorded_at')[:20]
    )
    return Response(ScreenSessionSerializer(sessions, many=True).data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def latest_analysis(request):
    """Return the most recent BehaviorAnalysis for the logged-in teen."""
    try:
        session = (
            ScreenSession.objects
            .filter(user=request.user)
            .prefetch_related('analysis')
            .latest('recorded_at')
        )
        analysis = session.analysis
        return Response(BehaviorAnalysisSerializer(analysis).data)
    except (ScreenSession.DoesNotExist, BehaviorAnalysis.DoesNotExist):
        return Response({'detail': 'No analysis yet.'}, status=status.HTTP_404_NOT_FOUND)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def weekly_summary(request):
    """Aggregated stats for the past 7 days."""
    from django.db.models import Avg, Count, Sum
    from datetime import timedelta

    seven_days_ago = timezone.now() - timedelta(days=7)
    sessions = ScreenSession.objects.filter(
        user=request.user,
        recorded_at__gte=seven_days_ago,
    )

    agg = sessions.aggregate(
        total_sessions=Count('id'),
        avg_total=Avg('total_time'),
        avg_social=Avg('social_time'),
        avg_study=Avg('study_time'),
        total_screen=Sum('total_time'),
    )

    # Count risk levels from analyses
    from django.db.models import Q
    risk_counts = {
        'none': BehaviorAnalysis.objects.filter(session__in=sessions, risk_level='none').count(),
        'low': BehaviorAnalysis.objects.filter(session__in=sessions, risk_level='low').count(),
        'medium': BehaviorAnalysis.objects.filter(session__in=sessions, risk_level='medium').count(),
        'high': BehaviorAnalysis.objects.filter(session__in=sessions, risk_level='high').count(),
    }

    state_counts = {}
    for state in ['normal', 'stressed', 'fatigued', 'distracted', 'overuse']:
        state_counts[state] = BehaviorAnalysis.objects.filter(
            session__in=sessions, detected_state=state
        ).count()

    return Response({
        **agg,
        'risk_counts': risk_counts,
        'state_counts': state_counts,
    })
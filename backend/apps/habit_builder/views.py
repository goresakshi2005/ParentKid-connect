"""
backend/apps/habit_builder/views.py

AI Habit Builder & Scheduler ViewSet.
Handles:
    - Habit CRUD (parent or teen creation)
    - Teen approval/rejection/modification of parent-created habits
    - Daily check-in with streak tracking & reward generation
    - AI-powered task analysis via Gemini
    - Teen and Parent dashboard aggregations
    - Rewards summary
"""

import json
import re
import logging
from datetime import date, timedelta

import google.generativeai as genai
from django.conf import settings
from django.db.models import Sum, Q
from rest_framework import status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet

from apps.users.models import ParentTeenLink
from .models import Habit, HabitLog, HabitReward
from .serializers import (
    HabitSerializer, HabitCreateSerializer, HabitResponseSerializer,
    AIAnalyzeSerializer, HabitLogSerializer, HabitRewardSerializer,
)
from .email_service import send_habit_completion_email

logger = logging.getLogger(__name__)
genai.configure(api_key=settings.GEMINI_API_KEY)


# ---------------------------------------------------------------------------
# AI helper — analyze a proposed task for teen suitability
# ---------------------------------------------------------------------------

def _ai_analyze_task(task_title, teen_age=15, interests='', routine=''):
    """
    Use Gemini to analyze whether a task is suitable for a teen and suggest
    improvements.
    Returns a dict with keys: feasibility, suggestion, recommended_duration,
    recommended_time.
    """
    prompt = f"""
You are an AI Habit Builder assistant for teenagers.

Analyze this proposed habit/task for a teenager:

Task: "{task_title}"
Teen Age: {teen_age}
Teen Interests: {interests or 'Not specified'}
Daily Routine: {routine or 'Not specified'}

Evaluate:
1. Is this task simple, realistic, and suitable for a teenager?
2. Can it be completed in 2–20 minutes?
3. Does it fit naturally into a daily routine?
4. Is it too strict or forceful?

Respond ONLY with a valid JSON object (no markdown, no explanation):
{{
    "feasibility": "suitable" or "needs_adjustment" or "not_suitable",
    "suggestion": "Your improved version or explanation (string)",
    "recommended_duration": <number in minutes, 2-20>,
    "recommended_time": "HH:MM" or null,
    "motivation_tip": "A short motivational tip for the teen"
}}
"""
    try:
        model = genai.GenerativeModel("gemini-2.0-flash")
        response = model.generate_content(prompt)
        raw = response.text.strip()

        # Strip markdown code fences
        raw = re.sub(r"^```(?:json)?\s*", "", raw)
        raw = re.sub(r"\s*```$", "", raw)

        result = json.loads(raw)
        return result
    except Exception as e:
        logger.error(f"AI analysis failed: {e}")
        return {
            "feasibility": "suitable",
            "suggestion": "Task looks fine. Give it a try!",
            "recommended_duration": 10,
            "recommended_time": None,
            "motivation_tip": "You've got this! Start small, stay consistent."
        }


# ---------------------------------------------------------------------------
# REWARD LOGIC
# ---------------------------------------------------------------------------

def _process_rewards(habit):
    """
    After a check-in, determine if new rewards should be granted based on
    the current streak. Returns a list of newly created HabitReward instances.
    """
    new_rewards = []
    streak = habit.streak

    # 1. Instant reward — every completion
    instant = HabitReward.objects.create(
        habit=habit,
        reward_type='instant',
        title='Task Complete!',
        description=f'Completed "{habit.title}" — keep it up!',
        points=10,
        badge_emoji='✅',
    )
    new_rewards.append(instant)
    habit.points_earned += 10

    # 2. Streak rewards
    streak_rewards = {
        3: ('Rising Star ⭐', 'You hit a 3-day streak!', 50, '⭐'),
        5: ('Habit Hero 🦸', 'Incredible 5-day streak!', 100, '🦸'),
        7: ('Habit Master 🏆', '7-day streak — HABIT FORMED!', 200, '🏆'),
        14: ('Two-Week Champion 💎', '14-day streak — legendary!', 500, '💎'),
        21: ('Unstoppable Force 🌟', '21-day streak — truly unstoppable!', 1000, '🌟'),
    }

    if streak in streak_rewards:
        title, desc, pts, emoji = streak_rewards[streak]
        # Check if this streak reward was already given
        already_exists = HabitReward.objects.filter(
            habit=habit, reward_type='streak', title=title
        ).exists()
        if not already_exists:
            sr = HabitReward.objects.create(
                habit=habit,
                reward_type='streak',
                title=title,
                description=desc,
                points=pts,
                badge_emoji=emoji,
            )
            new_rewards.append(sr)
            habit.points_earned += pts

    # 3. Milestone — when habit becomes "formed"
    if streak >= 7 and habit.stage != 'formed':
        already_exists = HabitReward.objects.filter(
            habit=habit, reward_type='milestone',
        ).exists()
        if not already_exists:
            mr = HabitReward.objects.create(
                habit=habit,
                reward_type='milestone',
                title='Golden Habit 🥇',
                description=f'"{habit.title}" is now a permanent habit!',
                points=500,
                badge_emoji='🥇',
            )
            new_rewards.append(mr)
            habit.points_earned += 500

    habit.save(update_fields=['points_earned'])
    return new_rewards


# ---------------------------------------------------------------------------
# VIEWSET
# ---------------------------------------------------------------------------

class HabitViewSet(ModelViewSet):
    serializer_class = HabitSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'teen':
            return Habit.objects.filter(teen=user, is_active=True)
        elif user.role == 'parent':
            # Parent sees habits for all linked teens
            teen_ids = ParentTeenLink.objects.filter(
                parent=user
            ).values_list('teen_id', flat=True)
            return Habit.objects.filter(
                Q(teen_id__in=teen_ids) | Q(parent=user),
                is_active=True,
            ).distinct()
        return Habit.objects.none()

    # ------------------------------------------------------------------
    # CREATE — parent or teen
    # ------------------------------------------------------------------
    def create(self, request):
        data = request.data.copy() if hasattr(request.data, 'copy') else dict(request.data)
        # DRF TimeField rejects empty string — normalize to None
        if not data.get('suggested_time'):
            data['suggested_time'] = None
        ser = HabitCreateSerializer(data=data)
        ser.is_valid(raise_exception=True)
        data = ser.validated_data
        user = request.user

        if user.role == 'teen':
            # Teen creates for themselves
            habit = Habit.objects.create(
                title=data['title'],
                description=data.get('description', ''),
                duration_minutes=data['duration_minutes'],
                suggested_time=data.get('suggested_time'),
                repetition=data['repetition'],
                created_by='teen',
                creator=user,
                teen=user,
                parent=self._get_linked_parent(user),
                approval_status='approved',  # teen-created → auto-approved
            )
        elif user.role == 'parent':
            # Parent creates for a teen
            teen_id = data.get('teen_id')
            if not teen_id:
                return Response(
                    {'error': 'teen_id is required for parent-created habits'},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            # Verify parent-teen link
            link = ParentTeenLink.objects.filter(
                parent=user, teen_id=teen_id
            ).first()
            if not link:
                return Response(
                    {'error': 'No linked teen found with this ID'},
                    status=status.HTTP_403_FORBIDDEN,
                )
            habit = Habit.objects.create(
                title=data['title'],
                description=data.get('description', ''),
                duration_minutes=data['duration_minutes'],
                suggested_time=data.get('suggested_time'),
                repetition=data['repetition'],
                created_by='parent',
                creator=user,
                teen_id=teen_id,
                parent=user,
                approval_status='pending',  # needs teen approval
            )
        else:
            return Response(
                {'error': 'Only parents and teens can create habits'},
                status=status.HTTP_403_FORBIDDEN,
            )

        # Run AI analysis
        analysis = _ai_analyze_task(habit.title)
        habit.ai_feasibility = analysis.get('feasibility', '')
        habit.ai_suggestion = analysis.get('suggestion', '')
        habit.save(update_fields=['ai_feasibility', 'ai_suggestion'])

        return Response(HabitSerializer(habit).data, status=status.HTTP_201_CREATED)

    # ------------------------------------------------------------------
    # TEEN RESPONDS to parent-created habit
    # ------------------------------------------------------------------
    @action(detail=True, methods=['patch'], url_path='respond')
    def respond(self, request, pk=None):
        habit = self.get_object()
        if request.user != habit.teen:
            return Response(
                {'error': 'Only the assigned teen can respond'},
                status=status.HTTP_403_FORBIDDEN,
            )
        if habit.created_by != 'parent':
            return Response(
                {'error': 'Only parent-created habits need approval'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        ser = HabitResponseSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        data = ser.validated_data

        habit.approval_status = data['status']
        habit.teen_feedback = data.get('feedback', '')

        if data['status'] == 'modified' and data.get('adjusted_title'):
            habit.adjusted_task = data['adjusted_title']
            habit.title = data['adjusted_title']
            # Re-run AI analysis on modified task
            analysis = _ai_analyze_task(habit.title)
            habit.ai_feasibility = analysis.get('feasibility', '')
            habit.ai_suggestion = analysis.get('suggestion', '')

        if data['status'] == 'rejected':
            habit.is_active = False

        habit.save()
        return Response(HabitSerializer(habit).data)

    # ------------------------------------------------------------------
    # DAILY CHECK-IN
    # ------------------------------------------------------------------
    @action(detail=True, methods=['post'], url_path='check_in')
    def check_in(self, request, pk=None):
        habit = self.get_object()
        if request.user != habit.teen:
            return Response(
                {'error': 'Only the assigned teen can check in'},
                status=status.HTTP_403_FORBIDDEN,
            )
        if habit.approval_status != 'approved':
            return Response(
                {'error': 'Habit must be approved before checking in'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        today = date.today()
        already = HabitLog.objects.filter(habit=habit, completed_date=today).exists()
        if already:
            return Response(
                {'error': 'Already checked in today!', 'already_completed': True},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Create log entry
        log = HabitLog.objects.create(
            habit=habit,
            checked_by=request.data.get('checked_by', 'manual'),
            notes=request.data.get('notes', ''),
        )

        # Update streak
        yesterday = today - timedelta(days=1)
        had_yesterday = HabitLog.objects.filter(
            habit=habit, completed_date=yesterday
        ).exists()

        if had_yesterday or habit.streak == 0:
            habit.streak += 1
        else:
            habit.streak = 1  # Reset streak

        habit.total_completions += 1
        if habit.streak > habit.best_streak:
            habit.best_streak = habit.streak

        # Update stage
        habit.update_stage()
        habit.save()

        # Process rewards
        new_rewards = _process_rewards(habit)

        # Send email notification to parent
        send_habit_completion_email(habit, habit.streak)

        # Build the email notification data for the JSON response
        email_data = {
            'send': bool(habit.parent),
            'subject': f'🎉 {habit.teen.get_full_name() or habit.teen.email} completed "{habit.title}"',
            'message': f'Streak: {habit.streak} days — {habit.get_stage_display()}',
        }

        return Response({
            'check_in': HabitLogSerializer(log).data,
            'habit': HabitSerializer(habit).data,
            'new_rewards': HabitRewardSerializer(new_rewards, many=True).data,
            'email_notification': email_data,
        })

    # ------------------------------------------------------------------
    # COMPLETION HISTORY for a habit
    # ------------------------------------------------------------------
    @action(detail=True, methods=['get'], url_path='history')
    def history(self, request, pk=None):
        habit = self.get_object()
        logs = habit.logs.all()[:30]
        return Response({
            'habit_id': habit.id,
            'title': habit.title,
            'logs': HabitLogSerializer(logs, many=True).data,
        })

    # ------------------------------------------------------------------
    # AI ANALYZE — preview analysis without creating
    # ------------------------------------------------------------------
    @action(detail=False, methods=['post'], url_path='ai_analyze')
    def ai_analyze(self, request):
        ser = AIAnalyzeSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        data = ser.validated_data

        analysis = _ai_analyze_task(
            task_title=data['task_title'],
            teen_age=data.get('teen_age', 15),
            interests=data.get('teen_interests', ''),
            routine=data.get('daily_routine', ''),
        )

        return Response({
            'task_analysis': {
                'feasibility': analysis.get('feasibility', ''),
                'suggestion': analysis.get('suggestion', ''),
            },
            'recommended_duration': analysis.get('recommended_duration', 10),
            'recommended_time': analysis.get('recommended_time'),
            'motivation_tip': analysis.get('motivation_tip', ''),
        })

    # ------------------------------------------------------------------
    # TEEN DASHBOARD — daily view (max 3-4 items, minimal)
    # ------------------------------------------------------------------
    @action(detail=False, methods=['get'], url_path='teen_dashboard')
    def teen_dashboard(self, request):
        if request.user.role != 'teen':
            return Response(
                {'error': 'Only teens can access this endpoint'},
                status=status.HTTP_403_FORBIDDEN,
            )

        today = date.today()
        habits = Habit.objects.filter(
            teen=request.user,
            is_active=True,
            approval_status='approved',
        ).order_by('suggested_time')[:4]  # max 4 items

        dashboard = []
        for h in habits:
            completed_today = h.logs.filter(completed_date=today).exists()
            dashboard.append({
                'id': h.id,
                'habit': h.title,
                'time': h.suggested_time.strftime('%H:%M') if h.suggested_time else None,
                'duration': h.duration_minutes,
                'status': 'completed' if completed_today else 'pending',
                'streak': h.streak,
                'stage': h.stage,
                'points_earned': h.points_earned,
                'created_by': h.created_by,
            })

        # Total points across all habits
        total_points = Habit.objects.filter(
            teen=request.user
        ).aggregate(total=Sum('points_earned'))['total'] or 0

        # Pending approvals (parent-created, awaiting teen response)
        pending = Habit.objects.filter(
            teen=request.user,
            approval_status='pending',
            is_active=True,
        ).count()

        return Response({
            'teen_dashboard': dashboard,
            'total_points': total_points,
            'pending_approvals': pending,
            'date': today.isoformat(),
        })

    # ------------------------------------------------------------------
    # PARENT DASHBOARD — monitoring view
    # ------------------------------------------------------------------
    @action(detail=False, methods=['get'], url_path='parent_dashboard')
    def parent_dashboard(self, request):
        if request.user.role != 'parent':
            return Response(
                {'error': 'Only parents can access this endpoint'},
                status=status.HTTP_403_FORBIDDEN,
            )

        today = date.today()
        teen_ids = ParentTeenLink.objects.filter(
            parent=request.user
        ).values_list('teen_id', flat=True)

        habits = Habit.objects.filter(
            teen_id__in=teen_ids,
            is_active=True,
        ).select_related('teen').order_by('-created_at')

        dashboard = []
        for h in habits:
            completed_today = h.logs.filter(completed_date=today).exists()
            dashboard.append({
                'id': h.id,
                'habit': h.title,
                'teen_name': h.teen.get_full_name() or h.teen.email,
                'approval_status': h.approval_status,
                'completion_status': 'completed' if completed_today else 'pending',
                'streak': h.streak,
                'stage': h.stage,
                'points_earned': h.points_earned,
                'created_by': h.created_by,
            })

        return Response({
            'parent_dashboard': dashboard,
            'date': today.isoformat(),
        })

    # ------------------------------------------------------------------
    # REWARDS SUMMARY
    # ------------------------------------------------------------------
    @action(detail=False, methods=['get'], url_path='rewards_summary')
    def rewards_summary(self, request):
        user = request.user
        if user.role == 'teen':
            habits = Habit.objects.filter(teen=user)
        elif user.role == 'parent':
            teen_ids = ParentTeenLink.objects.filter(
                parent=user
            ).values_list('teen_id', flat=True)
            habits = Habit.objects.filter(teen_id__in=teen_ids)
        else:
            return Response({'error': 'Unauthorized'}, status=403)

        total_points = habits.aggregate(total=Sum('points_earned'))['total'] or 0
        total_completions = habits.aggregate(
            total=Sum('total_completions'))['total'] or 0
        formed_habits = habits.filter(stage='formed').count()

        # Recent rewards across all habits
        recent_rewards = HabitReward.objects.filter(
            habit__in=habits
        ).order_by('-unlocked_at')[:10]

        return Response({
            'total_points': total_points,
            'total_completions': total_completions,
            'formed_habits': formed_habits,
            'active_habits': habits.filter(is_active=True).count(),
            'recent_rewards': HabitRewardSerializer(recent_rewards, many=True).data,
        })

    # ------------------------------------------------------------------
    # HELPER: get linked parent for a teen
    # ------------------------------------------------------------------
    def _get_linked_parent(self, teen_user):
        link = ParentTeenLink.objects.filter(teen=teen_user).first()
        return link.parent if link else None

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q
from django.utils import timezone
from django.core.mail import send_mail
from .models import Habit, HabitLog, HabitReward
from .serializers import HabitSerializer, HabitApprovalSerializer, HabitCompletionSerializer
from .services.email_service import send_task_completed_email
from apps.users.permissions import IsParent, IsTeen


class HabitViewSet(viewsets.ModelViewSet):
    serializer_class = HabitSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'parent':
            # Parent sees habits they created for their teens
            return Habit.objects.filter(parent=user)
        # Teen sees their own habits (both self-created and approved parent-created)
        return Habit.objects.filter(teen=user)

    def perform_create(self, serializer):
        # Creator (user) is set in serializer.create via context
        serializer.save()

    @action(detail=False, methods=['post'])
    def approve_or_modify(self, request):
        """Teen approves/rejects/modifies a parent-created task."""
        serializer = HabitApprovalSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        try:
            habit = Habit.objects.get(id=data['habit_id'], teen=request.user, created_by='parent')
        except Habit.DoesNotExist:
            return Response({'error': 'Habit not found or you are not the teen.'}, status=404)

        # Update approval status
        habit.approval_status = data['approval_status']
        habit.teen_feedback = data.get('feedback', '')

        if data['approval_status'] == 'modified':
            new_title = data.get('adjusted_title', habit.title)
            new_duration = data.get('adjusted_duration', habit.duration_minutes)
            habit.title = new_title
            habit.duration_minutes = new_duration
            habit.adjusted_task = new_title
        elif data['approval_status'] == 'rejected':
            habit.is_active = False
        elif data['approval_status'] == 'approved':
            # Task becomes active for teen dashboard
            pass

        habit.save()
        return Response(HabitSerializer(habit, context={'request': request}).data)

    @action(detail=False, methods=['post'])
    def complete_task(self, request):
        """Teen marks a task as completed."""
        serializer = HabitCompletionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        try:
            habit = Habit.objects.get(id=data['habit_id'], teen=request.user, is_active=True)
        except Habit.DoesNotExist:
            return Response({'error': 'Habit not found or not active.'}, status=404)

        # Prevent duplicate completion on same day
        today = timezone.now().date()
        if HabitLog.objects.filter(habit=habit, completed_date=today).exists():
            return Response({'error': 'Task already completed today.'}, status=400)

        # Create log
        HabitLog.objects.create(habit=habit, notes=data.get('notes', ''), checked_by='manual')
        habit.total_completions += 1

        # Update streak
        yesterday = today - timezone.timedelta(days=1)
        if HabitLog.objects.filter(habit=habit, completed_date=yesterday).exists():
            habit.streak += 1
        else:
            habit.streak = 1

        if habit.streak > habit.best_streak:
            habit.best_streak = habit.streak

        # Update stage
        if habit.streak >= 7:
            habit.stage = 'formed'
        elif habit.streak >= 1:
            habit.stage = 'building'
        else:
            habit.stage = 'not_started'

        # Add points (10 points per completion)
        POINTS_PER_TASK = 10
        habit.points_earned += POINTS_PER_TASK

        # Check for streak rewards
        self._check_streak_reward(habit)

        habit.save()

        # Send email to parent (if this habit was created by a parent)
        if habit.parent:
            send_task_completed_email(habit.parent.email, habit.teen.get_full_name(), habit)

        # Return updated habit
        return Response(HabitSerializer(habit, context={'request': request}).data)

    def _check_streak_reward(self, habit):
        """Unlock streak rewards at 3, 5, 7 days."""
        streak = habit.streak
        if streak in [3, 5, 7] and not HabitReward.objects.filter(habit=habit, reward_type='streak', title__contains=f'{streak} days').exists():
            reward_title = f"{streak}‑day streak"
            points = streak * 5  # e.g., 15, 25, 35 points
            description = f"Awesome! You've kept it up for {streak} days. +{points} bonus points!"
            HabitReward.objects.create(
                habit=habit,
                reward_type='streak',
                title=reward_title,
                description=description,
                points=points
            )
            habit.points_earned += points
            habit.save()
from rest_framework import serializers
from .models import Habit, HabitLog, HabitReward


class HabitLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = HabitLog
        fields = ['id', 'completed_at', 'completed_date', 'checked_by', 'notes']
        read_only_fields = ['id', 'completed_at', 'completed_date']


class HabitRewardSerializer(serializers.ModelSerializer):
    class Meta:
        model = HabitReward
        fields = ['id', 'reward_type', 'title', 'description', 'points',
                  'badge_emoji', 'unlocked_at']
        read_only_fields = ['id', 'unlocked_at']


class HabitSerializer(serializers.ModelSerializer):
    creator_name = serializers.SerializerMethodField()
    teen_name = serializers.SerializerMethodField()
    parent_name = serializers.SerializerMethodField()
    recent_rewards = serializers.SerializerMethodField()
    today_completed = serializers.SerializerMethodField()

    class Meta:
        model = Habit
        fields = [
            'id', 'title', 'description', 'duration_minutes',
            'suggested_time', 'repetition', 'created_by',
            'approval_status', 'teen_feedback', 'adjusted_task',
            'ai_feasibility', 'ai_suggestion',
            'stage', 'streak', 'best_streak', 'total_completions',
            'points_earned', 'is_active',
            'created_at', 'updated_at',
            # Computed
            'creator_name', 'teen_name', 'parent_name',
            'recent_rewards', 'today_completed',
        ]
        read_only_fields = [
            'id', 'created_at', 'updated_at', 'stage', 'streak',
            'best_streak', 'total_completions', 'points_earned',
            'ai_feasibility', 'ai_suggestion',
            'creator_name', 'teen_name', 'parent_name',
            'recent_rewards', 'today_completed',
        ]

    def get_creator_name(self, obj):
        return obj.creator.get_full_name() or obj.creator.email

    def get_teen_name(self, obj):
        return obj.teen.get_full_name() or obj.teen.email

    def get_parent_name(self, obj):
        if obj.parent:
            return obj.parent.get_full_name() or obj.parent.email
        return None

    def get_recent_rewards(self, obj):
        rewards = obj.rewards.all()[:5]
        return HabitRewardSerializer(rewards, many=True).data

    def get_today_completed(self, obj):
        from datetime import date
        return obj.logs.filter(completed_date=date.today()).exists()


class HabitCreateSerializer(serializers.Serializer):
    """Used for creating habits — handles parent vs teen creation logic."""
    title = serializers.CharField(max_length=255)
    description = serializers.CharField(required=False, default='', allow_blank=True)
    duration_minutes = serializers.IntegerField(min_value=1, default=10)
    suggested_time = serializers.TimeField(required=False, allow_null=True)
    repetition = serializers.ChoiceField(choices=['daily', 'weekly'], default='daily')
    teen_id = serializers.IntegerField(required=False,
        help_text='Required when parent creates habit for a teen')


class HabitResponseSerializer(serializers.Serializer):
    """Used for teen responding to a parent-created habit."""
    status = serializers.ChoiceField(choices=['approved', 'rejected', 'modified'])
    feedback = serializers.CharField(required=False, default='')
    adjusted_title = serializers.CharField(required=False, default='')


class AIAnalyzeSerializer(serializers.Serializer):
    """Used for AI analysis of a proposed task."""
    task_title = serializers.CharField(max_length=255)
    teen_age = serializers.IntegerField(required=False, default=15)
    teen_interests = serializers.CharField(required=False, default='')
    daily_routine = serializers.CharField(required=False, default='')

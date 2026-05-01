from rest_framework import serializers
from .models import Habit, HabitLog, HabitReward


class HabitLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = HabitLog
        fields = ['id', 'completed_at', 'completed_date', 'notes']


class HabitRewardSerializer(serializers.ModelSerializer):
    class Meta:
        model = HabitReward
        fields = ['id', 'reward_type', 'title', 'description', 'points', 'badge_emoji', 'unlocked_at']


class HabitSerializer(serializers.ModelSerializer):
    logs = HabitLogSerializer(many=True, read_only=True)
    rewards = HabitRewardSerializer(many=True, read_only=True)
    teen_name = serializers.CharField(source='teen.get_full_name', read_only=True)
    parent_name = serializers.CharField(source='parent.get_full_name', read_only=True)

    class Meta:
        model = Habit
        fields = [
            'id', 'title', 'description', 'duration_minutes', 'suggested_time',
            'repetition', 'created_by', 'approval_status', 'teen_feedback',
            'adjusted_task', 'stage', 'streak', 'best_streak', 'total_completions',
            'points_earned', 'is_active', 'created_at', 'updated_at',
            'logs', 'rewards', 'teen_name', 'parent_name', 'creator', 'parent', 'teen'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'creator', 'parent', 'teen']

    def create(self, validated_data):
        request = self.context.get('request')
        if request and request.user:
            validated_data['creator'] = request.user
            if validated_data.get('created_by') == 'parent':
                validated_data['parent'] = request.user
                validated_data['approval_status'] = 'pending'
                teen_id = request.data.get('teen')
                if teen_id:
                    validated_data['teen_id'] = teen_id
            else:
                validated_data['teen'] = request.user
                validated_data['approval_status'] = 'approved'
        return super().create(validated_data)


class HabitApprovalSerializer(serializers.Serializer):
    habit_id = serializers.IntegerField()
    approval_status = serializers.ChoiceField(choices=['approved', 'rejected', 'modified'])
    feedback = serializers.CharField(required=False, allow_blank=True)
    adjusted_title = serializers.CharField(required=False, allow_blank=True)
    adjusted_duration = serializers.IntegerField(required=False, min_value=2, max_value=20)


class HabitCompletionSerializer(serializers.Serializer):
    habit_id = serializers.IntegerField()
    notes = serializers.CharField(required=False, allow_blank=True)
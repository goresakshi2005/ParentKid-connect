from django.contrib import admin
from .models import Habit, HabitLog, HabitReward


@admin.register(Habit)
class HabitAdmin(admin.ModelAdmin):
    list_display = ['title', 'teen', 'created_by', 'approval_status',
                    'stage', 'streak', 'points_earned', 'is_active']
    list_filter = ['stage', 'approval_status', 'created_by', 'is_active']
    search_fields = ['title', 'teen__email', 'teen__first_name']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(HabitLog)
class HabitLogAdmin(admin.ModelAdmin):
    list_display = ['habit', 'completed_date', 'checked_by']
    list_filter = ['checked_by', 'completed_date']


@admin.register(HabitReward)
class HabitRewardAdmin(admin.ModelAdmin):
    list_display = ['title', 'habit', 'reward_type', 'points', 'badge_emoji']
    list_filter = ['reward_type']

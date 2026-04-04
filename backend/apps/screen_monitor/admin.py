from django.contrib import admin
from .models import ScreenSession, BehaviorAnalysis


@admin.register(ScreenSession)
class ScreenSessionAdmin(admin.ModelAdmin):
    list_display = ('user', 'recorded_at', 'total_time', 'social_time', 'study_time', 'time_of_day')
    list_filter = ('time_of_day',)
    search_fields = ('user__email',)


@admin.register(BehaviorAnalysis)
class BehaviorAnalysisAdmin(admin.ModelAdmin):
    list_display = ('session', 'detected_state', 'intensity', 'risk_level', 'parent_alert', 'analyzed_at')
    list_filter = ('detected_state', 'risk_level', 'parent_alert')
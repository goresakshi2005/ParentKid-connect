from django.contrib import admin
from .models import Assessment, AssessmentResult

@admin.register(Assessment)
class AssessmentAdmin(admin.ModelAdmin):
    list_display = ('title', 'assessment_type', 'stage', 'created_at')
    list_filter = ('assessment_type', 'stage')

@admin.register(AssessmentResult)
class AssessmentResultAdmin(admin.ModelAdmin):
    list_display = ('assessment', 'user', 'child', 'final_score', 'risk_level', 'created_at')
    list_filter = ('risk_level',)
from django.contrib import admin
from .models import StudyTask


@admin.register(StudyTask)
class StudyTaskAdmin(admin.ModelAdmin):
    list_display = ('title', 'task_type', 'date', 'time', 'priority', 'status', 'user')
    list_filter = ('task_type', 'priority', 'status', 'deadline')
    search_fields = ('title', 'user__email')
    ordering = ('date', 'time')
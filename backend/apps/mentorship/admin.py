from django.contrib import admin
from .models import Mentor, MentorAssignment, ChatMessage


@admin.register(Mentor)
class MentorAdmin(admin.ModelAdmin):
    list_display = [
        'user', 'specialization', 'is_available',
        'max_clients', 'active_client_count', 'created_at',
    ]
    list_filter = ['specialization', 'is_available']
    search_fields = ['user__first_name', 'user__last_name', 'user__email']

    def active_client_count(self, obj):
        return obj.active_client_count
    active_client_count.short_description = 'Active Clients'


@admin.register(MentorAssignment)
class MentorAssignmentAdmin(admin.ModelAdmin):
    list_display = ['user', 'mentor', 'stage', 'is_active', 'assigned_at']
    list_filter = ['stage', 'is_active']
    search_fields = [
        'user__first_name', 'user__last_name',
        'mentor__user__first_name', 'mentor__user__last_name',
    ]


@admin.register(ChatMessage)
class ChatMessageAdmin(admin.ModelAdmin):
    list_display = ['sender', 'receiver', 'short_message', 'timestamp', 'is_read']
    list_filter = ['is_read', 'timestamp']
    search_fields = ['message', 'sender__first_name', 'receiver__first_name']

    def short_message(self, obj):
        return obj.message[:60]
    short_message.short_description = 'Message'

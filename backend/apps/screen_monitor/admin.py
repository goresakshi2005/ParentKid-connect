# backend/apps/screen_monitor/admin.py

from django.contrib import admin
from .models import Device, AppUsage


@admin.register(Device)
class DeviceAdmin(admin.ModelAdmin):
    list_display = ['device_name', 'device_id', 'user', 'registered_at', 'last_sync']
    list_filter = ['registered_at']
    search_fields = ['device_name', 'device_id', 'user__email']


@admin.register(AppUsage)
class AppUsageAdmin(admin.ModelAdmin):
    list_display = ['app_name', 'package_name', 'usage_minutes', 'date', 'device']
    list_filter = ['date', 'device']
    search_fields = ['app_name', 'package_name']
    ordering = ['-date', '-usage_time']

    def usage_minutes(self, obj):
        return f"{obj.usage_minutes} min"
    usage_minutes.short_description = 'Usage (min)'
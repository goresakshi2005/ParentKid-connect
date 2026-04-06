# backend/apps/screen_monitor/serializers.py

from rest_framework import serializers
from .models import Device, AppUsage


class DeviceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Device
        fields = ['id', 'device_name', 'device_id', 'registered_at', 'last_sync']
        read_only_fields = ['id', 'registered_at', 'last_sync']


class AppUsageSerializer(serializers.ModelSerializer):
    usage_minutes = serializers.ReadOnlyField()

    class Meta:
        model = AppUsage
        fields = [
            'id', 'app_name', 'package_name',
            'usage_time', 'usage_minutes', 'date', 'timestamp'
        ]
        read_only_fields = ['id', 'timestamp', 'usage_minutes']


class AppUsageUploadItemSerializer(serializers.Serializer):
    """Used for each item in the batch upload from Android."""
    app_name = serializers.CharField(max_length=255)
    package_name = serializers.CharField(max_length=255)
    usage_time = serializers.IntegerField(min_value=0)  # seconds
    date = serializers.DateField()


class ScreenTimeUploadSerializer(serializers.Serializer):
    """Top-level payload sent by the Android app."""
    device_id = serializers.CharField(max_length=255)
    usages = AppUsageUploadItemSerializer(many=True)


class DailySummarySerializer(serializers.Serializer):
    """Aggregated daily summary returned to the React frontend."""
    date = serializers.DateField()
    total_seconds = serializers.IntegerField()
    total_minutes = serializers.FloatField()
    app_count = serializers.IntegerField()
    apps = AppUsageSerializer(many=True)
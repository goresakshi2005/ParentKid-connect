# backend/apps/screen_monitor/views.py

from django.utils import timezone
from django.db.models import Sum
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import get_user_model, authenticate
from collections import defaultdict

from .models import Device, AppUsage
from .serializers import (
    DeviceSerializer,
    AppUsageSerializer,
    ScreenTimeUploadSerializer,
    DailySummarySerializer,
)

User = get_user_model()


# ─────────────────────────────────────────
# AUTH
# ─────────────────────────────────────────

@api_view(['POST'])
@permission_classes([AllowAny])
def register(request):
    """
    POST /api/register
    Body: { "username": "...", "email": "...", "password": "..." }
    """
    username = request.data.get('username', '').strip()
    email = request.data.get('email', '').strip()
    password = request.data.get('password', '')

    if not username or not email or not password:
        return Response(
            {'error': 'username, email and password are required.'},
            status=status.HTTP_400_BAD_REQUEST
        )

    if User.objects.filter(username=username).exists():
        return Response(
            {'error': 'Username already taken.'},
            status=status.HTTP_400_BAD_REQUEST
        )

    user = User.objects.create_user(username=username, email=email, password=password)
    refresh = RefreshToken.for_user(user)

    return Response({
        'message': 'Account created successfully.',
        'access': str(refresh.access_token),
        'refresh': str(refresh),
        'user': {'id': user.id, 'username': user.username, 'email': user.email},
    }, status=status.HTTP_201_CREATED)


@api_view(['POST'])
@permission_classes([AllowAny])
def login_view(request):
    """
    POST /api/login
    Body: { "username": "...", "password": "..." }
    Returns JWT access + refresh tokens.
    """
    username = request.data.get('username', '')
    password = request.data.get('password', '')

    user = authenticate(request, username=username, password=password)
    if user is None:
        return Response(
            {'error': 'Invalid credentials.'},
            status=status.HTTP_401_UNAUTHORIZED
        )

    refresh = RefreshToken.for_user(user)
    return Response({
        'access': str(refresh.access_token),
        'refresh': str(refresh),
        'user': {'id': user.id, 'username': user.username, 'email': user.email},
    })


# ─────────────────────────────────────────
# DEVICE MANAGEMENT
# ─────────────────────────────────────────

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def register_device(request):
    """
    POST /api/register-device
    Body: { "device_name": "Aarav's Phone", "device_id": "abc123xyz" }
    Creates or returns the device linked to the logged-in parent.
    """
    device_id = request.data.get('device_id', '').strip()
    device_name = request.data.get('device_name', 'My Device').strip()

    if not device_id:
        return Response({'error': 'device_id is required.'}, status=status.HTTP_400_BAD_REQUEST)

    device, created = Device.objects.get_or_create(
        device_id=device_id,
        defaults={'user': request.user, 'device_name': device_name}
    )

    return Response(
        DeviceSerializer(device).data,
        status=status.HTTP_201_CREATED if created else status.HTTP_200_OK
    )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_devices(request):
    """
    GET /api/devices
    Returns all devices registered by the logged-in parent.
    """
    devices = Device.objects.filter(user=request.user)
    return Response(DeviceSerializer(devices, many=True).data)


# ─────────────────────────────────────────
# SCREEN TIME UPLOAD (called by Android)
# ─────────────────────────────────────────

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def upload_screen_time(request):
    """
    POST /api/upload-screen-time
    Body:
    {
      "device_id": "abc123xyz",
      "usages": [
        { "app_name": "YouTube", "package_name": "com.google.youtube", "usage_time": 3600, "date": "2025-01-15" },
        ...
      ]
    }
    """
    serializer = ScreenTimeUploadSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    device_id = serializer.validated_data['device_id']
    usages_data = serializer.validated_data['usages']

    # Find device belonging to this user
    try:
        device = Device.objects.get(device_id=device_id, user=request.user)
    except Device.DoesNotExist:
        return Response(
            {'error': 'Device not found. Register the device first.'},
            status=status.HTTP_404_NOT_FOUND
        )

    created_count = 0
    updated_count = 0

    for item in usages_data:
        obj, created = AppUsage.objects.update_or_create(
            device=device,
            package_name=item['package_name'],
            date=item['date'],
            defaults={
                'app_name': item['app_name'],
                'usage_time': item['usage_time'],
            }
        )
        if created:
            created_count += 1
        else:
            updated_count += 1

    # Update last_sync timestamp
    device.last_sync = timezone.now()
    device.save(update_fields=['last_sync'])

    return Response({
        'message': 'Screen time data uploaded successfully.',
        'created': created_count,
        'updated': updated_count,
    }, status=status.HTTP_200_OK)


# ─────────────────────────────────────────
# GET USAGE (called by React frontend)
# ─────────────────────────────────────────

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_usage(request):
    """
    GET /api/get-usage?device_id=abc123xyz&days=7
    Returns daily summaries of screen time for the specified device.
    Query params:
      - device_id (required)
      - days      (optional, default=7)
    """
    device_id = request.query_params.get('device_id')
    days = int(request.query_params.get('days', 7))

    if not device_id:
        # If no device_id, return data for all user's devices
        devices = Device.objects.filter(user=request.user)
    else:
        devices = Device.objects.filter(device_id=device_id, user=request.user)

    if not devices.exists():
        return Response({'error': 'No devices found.'}, status=status.HTTP_404_NOT_FOUND)

    from datetime import date, timedelta
    cutoff = date.today() - timedelta(days=days)

    usages = AppUsage.objects.filter(
        device__in=devices,
        date__gte=cutoff
    ).order_by('-date', '-usage_time')

    # Group by date
    by_date = defaultdict(list)
    for u in usages:
        by_date[str(u.date)].append(u)

    summaries = []
    for day_str in sorted(by_date.keys(), reverse=True):
        day_usages = by_date[day_str]
        total_secs = sum(u.usage_time for u in day_usages)
        summaries.append({
            'date': day_str,
            'total_seconds': total_secs,
            'total_minutes': round(total_secs / 60, 1),
            'app_count': len(day_usages),
            'apps': AppUsageSerializer(day_usages, many=True).data,
        })

    # Also compute overall totals
    total_overall = usages.aggregate(total=Sum('usage_time'))['total'] or 0

    return Response({
        'device_count': devices.count(),
        'days_requested': days,
        'total_minutes_overall': round(total_overall / 60, 1),
        'daily_summaries': summaries,
    })
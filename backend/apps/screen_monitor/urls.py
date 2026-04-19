# backend/apps/screen_monitor/urls.py

from django.urls import path
from . import views

urlpatterns = [
    # Auth
    path('register', views.register, name='sm-register'),
    path('login', views.login_view, name='sm-login'),

    # Device management
    path('register-device', views.register_device, name='sm-register-device'),
    path('devices', views.list_devices, name='sm-list-devices'),

    # Screen time data
    path('upload-screen-time', views.upload_screen_time, name='sm-upload'),
    path('get-usage', views.get_usage, name='sm-get-usage'),
    path('screen-intelligence', views.get_screen_time_intelligence, name='sm-screen-intelligence'),
]
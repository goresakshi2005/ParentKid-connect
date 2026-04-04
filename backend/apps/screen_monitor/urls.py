from django.urls import path
from . import views

urlpatterns = [
    path('session/', views.log_session, name='screen-log-session'),
    path('sessions/', views.list_sessions, name='screen-list-sessions'),
    path('latest/', views.latest_analysis, name='screen-latest-analysis'),
    path('summary/', views.weekly_summary, name='screen-weekly-summary'),
]
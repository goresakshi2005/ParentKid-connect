# backend/apps/insights/urls.py

from django.urls import path
from .views import HarmonyAIView, HarmonyHistoryView

urlpatterns = [
    path('harmony-ai/', HarmonyAIView.as_view(), name='harmony-ai'),
    path('harmony-ai/history/<int:child_id>/', HarmonyHistoryView.as_view(), name='harmony-ai-history'),
]

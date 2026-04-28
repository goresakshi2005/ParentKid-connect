# backend/apps/insights/urls.py

from django.urls import path
from .views import HarmonyAIView, HarmonyHistoryView, HarmonyDeleteView

urlpatterns = [
    path('harmony-ai/', HarmonyAIView.as_view(), name='harmony-ai'),
    path('harmony-ai/history/<int:child_id>/', HarmonyHistoryView.as_view(), name='harmony-ai-history'),
    path('harmony-ai/delete/<int:report_id>/', HarmonyDeleteView.as_view(), name='harmony-ai-delete'),
]

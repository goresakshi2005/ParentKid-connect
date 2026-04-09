# backend/apps/relationship_intelligence/urls.py

from django.urls import path
from .views import RelationshipAnalysisView, RelationshipHistoryView

urlpatterns = [
    path('analyze/', RelationshipAnalysisView.as_view(), name='relationship-analyze'),
    path('history/<int:child_id>/', RelationshipHistoryView.as_view(), name='relationship-history'),
]
# backend/apps/relationship_intelligence/urls.py

from django.urls import path
from .views import RelationshipAnalysisView, RelationshipHistoryView, MagicFixView, MagicFixHistoryListView, BondBridgeView

urlpatterns = [
    path('analyze/', RelationshipAnalysisView.as_view(), name='relationship-analyze'),
    path('history/<int:child_id>/', RelationshipHistoryView.as_view(), name='relationship-history'),
    path('magic-fix/', MagicFixView.as_view(), name='relationship-magic-fix'),
    path('magic-fix-history/<int:child_id>/', MagicFixHistoryListView.as_view(), name='relationship-magic-fix-history'),
    path('bond-bridge/', BondBridgeView.as_view(), name='relationship-bond-bridge'),
]
from django.urls import path
from .views import EarlyChildhoodAnalysisView, EarlyChildhoodHistoryView

urlpatterns = [
    path('analyze/', EarlyChildhoodAnalysisView.as_view(), name='early-childhood-analyze'),
    path('history/<int:child_id>/', EarlyChildhoodHistoryView.as_view(), name='early-childhood-history'),
]

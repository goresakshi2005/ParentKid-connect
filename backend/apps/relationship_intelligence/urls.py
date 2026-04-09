from django.urls import path
from .views import RelationshipAnalysisView

urlpatterns = [
    path('analyze/', RelationshipAnalysisView.as_view(), name='relationship-analyze'),
]

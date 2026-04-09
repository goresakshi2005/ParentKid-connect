from django.urls import path
from .views import (
    RelationshipStateView, RecommendationView, MoodCheckInView, 
    InteractionFeedbackView, BehaviorSignalView, RelationshipAnalysisView
)

urlpatterns = [
    path('state/', RelationshipStateView.as_view(), name='rel-state'),
    path('recommendation/', RecommendationView.as_view(), name='rel-recommendation'),
    path('mood-checkin/', MoodCheckInView.as_view(), name='rel-mood'),
    path('feedback/', InteractionFeedbackView.as_view(), name='rel-feedback'),
    path('signal/', BehaviorSignalView.as_view(), name='rel-signal'),
    path('analyze/', RelationshipAnalysisView.as_view(), name='relationship-analyze'),
]

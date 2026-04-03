from django.urls import path
from .views import StartSessionView, RespondView, ResultView, LatestResultView

urlpatterns = [
    path('start/',                      StartSessionView.as_view(),  name='voice-start'),
    path('respond/',                    RespondView.as_view(),        name='voice-respond'),
    path('result/<uuid:session_id>/',   ResultView.as_view(),         name='voice-result'),
    path('latest/',                     LatestResultView.as_view(),   name='voice-latest'),
]
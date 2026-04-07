from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import MentorViewSet, MentorAssignmentViewSet, ChatViewSet

router = DefaultRouter()
router.register(r'mentors', MentorViewSet, basename='mentor')
router.register(r'assignments', MentorAssignmentViewSet, basename='mentor-assignment')
router.register(r'chat', ChatViewSet, basename='mentor-chat')

urlpatterns = [
    path('', include(router.urls)),
]

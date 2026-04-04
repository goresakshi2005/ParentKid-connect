from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import StudyTaskViewSet

router = DefaultRouter()
router.register(r'study-tasks', StudyTaskViewSet, basename='study-task')

urlpatterns = [
    path('', include(router.urls)),
]
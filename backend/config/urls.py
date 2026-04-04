from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework.routers import DefaultRouter
from apps.users.views import UserViewSet
from apps.children.views import ChildViewSet
from apps.assessments.views import AssessmentViewSet
from apps.subscriptions.views import SubscriptionViewSet

router = DefaultRouter()
router.register(r'users', UserViewSet, basename='user')
router.register(r'children', ChildViewSet, basename='child')
router.register(r'assessments', AssessmentViewSet, basename='assessment')
router.register(r'subscriptions', SubscriptionViewSet, basename='subscription')

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include(router.urls)),
    path('api-auth/', include('rest_framework.urls')),

    # ✅ Fixed: reports and appointments now under /api/ prefix
    # so frontend calls http://localhost:8000/api/reports/upload/ correctly
    path('api/', include('apps.reports.urls')),
    path('api/voice-assessments/', include('apps.voice_assessments.urls')),
    path('api/', include('apps.study_planner.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
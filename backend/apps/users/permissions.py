from rest_framework import permissions

class IsParent(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'parent'

class IsTeen(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'teen'

from rest_framework.exceptions import APIException
from rest_framework import status
from apps.subscriptions.services.access_control import user_has_feature
from apps.subscriptions.models import SubscriptionPlan

class LockedFeatureException(APIException):
    status_code = status.HTTP_403_FORBIDDEN
    default_detail = 'Upgrade your plan to access this feature'
    default_code = 'FEATURE_LOCKED'

    def __init__(self, feature_name, required_plan=None):
        self.detail = {
            "error": "FEATURE_LOCKED",
            "message": self.default_detail,
            "required_plan": required_plan or "UPGRADE"
        }

class HasFeaturePermission(permissions.BasePermission):
    def __init__(self, feature_name):
        self.feature_name = feature_name

    def has_permission(self, request, view):
        if not user_has_feature(request.user, self.feature_name):
            # Try to find which plan first offers this feature
            plan = SubscriptionPlan.objects.filter(features__name=self.feature_name).order_by('price').first()
            required_plan = plan.get_plan_name_display().upper() if plan else "UPGRADE"
            raise LockedFeatureException(self.feature_name, required_plan)
        return True
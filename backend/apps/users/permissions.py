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
        self.feature_name = feature_name
        self.required_plan = required_plan or "UPGRADE"
        detail = {
            "error": "FEATURE_LOCKED",
            "message": self.default_detail,
            "required_plan": self.required_plan
        }
        super().__init__(detail=detail)

class HasFeaturePermission(permissions.BasePermission):
    def __init__(self, feature_name):
        self.feature_name = feature_name

    def __call__(self):
        """
        Allows using an instance of this class directly in permission_classes:
        permission_classes = [HasFeaturePermission("feature_name")]
        """
        return self

    def has_permission(self, request, view):
        # Allow read-only access to show the interface even if locked
        if request.method in permissions.SAFE_METHODS:
            return True

        if not user_has_feature(request.user, self.feature_name):
            # Try to find which plan first offers this feature
            plan = SubscriptionPlan.objects.filter(features__name=self.feature_name).order_by('price').first()
            required_plan = "UPGRADE"
            if plan:
                try:
                    required_plan = plan.get_plan_name_display().upper()
                except Exception:
                    required_plan = plan.plan_name.upper()
            
            raise LockedFeatureException(self.feature_name, required_plan)
        return True
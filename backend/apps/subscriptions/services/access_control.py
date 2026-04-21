from apps.subscriptions.models import Subscription, SubscriptionPlan, Feature
from django.utils import timezone

def user_has_feature(user, feature_name):
    """
    Check if a user has access to a specific feature based on their active subscription.
    Teens inherit feature access from their parents.
    """
    if not user.is_authenticated:
        return False
        
    effective_user = user
    if hasattr(user, 'role') and user.role == 'teen':
        from apps.users.models import ParentTeenLink
        link = ParentTeenLink.objects.filter(teen=user).select_related('parent').first()
        if link:
            effective_user = link.parent
            
    try:
        # Get active subscription for the effective user (parent for teens)
        active_subscription = Subscription.objects.filter(
            user=effective_user,
            status='active',
            end_date__gt=timezone.now()
        ).select_related('plan').first()
        
        if not active_subscription:
            # Default to FREE plan features
            free_plan = SubscriptionPlan.objects.filter(plan_name='free').first()
            if not free_plan:
                return False
            return free_plan.features.filter(name=feature_name).exists()
            
        # Check if feature exists in the user's plan
        return active_subscription.plan.features.filter(name=feature_name).exists()
        
    except Exception:
        return False

def get_user_features(user):
    """
    Return a list of all features accessible to the user.
    """
    if not user.is_authenticated:
        return []
        
    effective_user = user
    if hasattr(user, 'role') and user.role == 'teen':
        from apps.users.models import ParentTeenLink
        link = ParentTeenLink.objects.filter(teen=user).select_related('parent').first()
        if link:
            effective_user = link.parent

    active_subscription = Subscription.objects.filter(
        user=effective_user,
        status='active',
        end_date__gt=timezone.now()
    ).select_related('plan').first()
    
    if not active_subscription:
        plan = SubscriptionPlan.objects.filter(plan_name='free').first()
    else:
        plan = active_subscription.plan
        
    if not plan:
        return []
        
    return list(plan.features.values_list('name', flat=True))

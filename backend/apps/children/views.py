from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import Child
from .serializers import ChildSerializer
from apps.subscriptions.models import Subscription
from apps.users.permissions import IsParent

class ChildViewSet(viewsets.ModelViewSet):
    serializer_class = ChildSerializer
    permission_classes = [IsAuthenticated, IsParent]
    
    def get_queryset(self):
        return Child.objects.filter(parent=self.request.user)

    def perform_create(self, serializer):
        serializer.save(parent=self.request.user)
    
    def create(self, request, *args, **kwargs):
        try:
            subscription = Subscription.objects.get(user=request.user)
            child_count = Child.objects.filter(parent=request.user).count()
            
            if child_count >= subscription.plan.max_child_profiles:
                return Response(
                    {'error': f'Your plan allows only {subscription.plan.max_child_profiles} child profile(s). Please upgrade.'},
                    status=status.HTTP_403_FORBIDDEN
                )
        except Subscription.DoesNotExist:
            # If no subscription exists (e.g. superuser), we'll allow it for now
            pass
        
        return super().create(request, *args, **kwargs)
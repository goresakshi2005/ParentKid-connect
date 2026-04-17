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
        # Removed limit check to allow parents to create more than one kid.
        return super().create(request, *args, **kwargs)
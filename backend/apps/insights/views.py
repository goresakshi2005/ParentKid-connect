from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from .models import Insight
from .serializers import InsightSerializer

class InsightViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = InsightSerializer

    def get_queryset(self):
        # For future implementation
        return Insight.objects.none()
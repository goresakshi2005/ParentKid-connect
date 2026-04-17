from rest_framework import serializers
from .models import EarlyChildhoodReport

class EarlyChildhoodReportSerializer(serializers.ModelSerializer):
    class Meta:
        model = EarlyChildhoodReport
        fields = '__all__'

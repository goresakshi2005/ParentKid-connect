from rest_framework import serializers
from .models import Child

class ChildSerializer(serializers.ModelSerializer):
    age = serializers.SerializerMethodField()
    
    class Meta:
        model = Child
        fields = ['id', 'name', 'date_of_birth', 'avatar', 'stage', 'age', 'invite_code', 'created_at']
        read_only_fields = ['id', 'created_at', 'stage', 'invite_code']
    
    def get_age(self, obj):
        return obj.get_age()
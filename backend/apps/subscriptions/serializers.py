from rest_framework import serializers
from .models import Feature, SubscriptionPlan, Subscription

class FeatureSerializer(serializers.ModelSerializer):
    class Meta:
        model = Feature
        fields = ['name', 'description']

class SubscriptionPlanSerializer(serializers.ModelSerializer):
    features = serializers.SlugRelatedField(
        many=True,
        read_only=True,
        slug_field='name'
    )
    
    class Meta:
        model = SubscriptionPlan
        fields = '__all__'

class SubscriptionSerializer(serializers.ModelSerializer):
    plan = SubscriptionPlanSerializer(read_only=True)
    is_active = serializers.SerializerMethodField()
    
    class Meta:
        model = Subscription
        fields = '__all__'
    
    def get_is_active(self, obj):
        return obj.is_active()
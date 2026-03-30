from django.db import models
from django.contrib.auth import get_user_model
from datetime import timedelta
from django.utils import timezone

User = get_user_model()

class SubscriptionPlan(models.Model):
    PLAN_CHOICES = (
        ('free', 'Free'),
        ('starter', 'Starter'),
        ('growth', 'Growth'),
        ('family', 'Family+'),
    )
    
    plan_name = models.CharField(max_length=50, choices=PLAN_CHOICES, unique=True)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    currency = models.CharField(max_length=3, default='INR')
    duration_days = models.IntegerField(default=30)
    
    max_child_profiles = models.IntegerField(default=1)
    unlimited_assessments = models.BooleanField(default=False)
    detailed_insights = models.BooleanField(default=False)
    personalized_recommendations = models.BooleanField(default=False)
    downloadable_reports = models.BooleanField(default=False)
    priority_support = models.BooleanField(default=False)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['price']
    
    def __str__(self):
        return f"{self.get_plan_name_display()} - ₹{self.price}"

class Subscription(models.Model):
    STATUS_CHOICES = (
        ('active', 'Active'),
        ('expired', 'Expired'),
        ('cancelled', 'Cancelled'),
    )
    
    user = models.OneToOneField(User, on_delete=models.CASCADE, 
                                related_name='subscription')
    plan = models.ForeignKey(SubscriptionPlan, on_delete=models.PROTECT)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    
    start_date = models.DateTimeField(auto_now_add=True)
    end_date = models.DateTimeField()
    
    razorpay_order_id = models.CharField(max_length=100, blank=True)
    razorpay_payment_id = models.CharField(max_length=100, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-start_date']
    
    def __str__(self):
        return f"{self.user.email} - {self.plan.get_plan_name_display()}"
    
    def is_active(self):
        return self.status == 'active' and self.end_date > timezone.now()
    
    def save(self, *args, **kwargs):
        if not self.end_date:
            duration = timedelta(days=self.plan.duration_days)
            self.end_date = timezone.now() + duration
        super().save(*args, **kwargs)
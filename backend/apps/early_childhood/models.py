from django.db import models
from django.conf import settings
from apps.children.models import Child

class EarlyChildhoodReport(models.Model):
    child = models.ForeignKey(Child, on_delete=models.CASCADE, related_name='early_childhood_reports')
    parent = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    
    # input data
    age = models.FloatField(null=True, blank=True)
    gender = models.CharField(max_length=50, blank=True)
    weight = models.FloatField(null=True, blank=True)
    height = models.FloatField(null=True, blank=True)
    
    speech_status = models.CharField(max_length=255, blank=True)
    response_name = models.CharField(max_length=255, blank=True)
    eye_contact = models.CharField(max_length=255, blank=True)
    motor_skills = models.CharField(max_length=255, blank=True)
    social_behavior = models.CharField(max_length=255, blank=True)
    
    eating_habit = models.CharField(max_length=255, blank=True)
    sleep_hours = models.FloatField(null=True, blank=True)
    screen_time = models.FloatField(null=True, blank=True)
    
    problem_selected = models.CharField(max_length=255, blank=True)
    parent_text = models.TextField(blank=True, null=True)
    input_confidence = models.CharField(max_length=50, blank=True)
    
    # ai output results
    analysis_result = models.JSONField(blank=True, null=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']

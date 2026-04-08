from django.db import models
from django.contrib.auth import get_user_model
from django.core.validators import MinValueValidator, MaxValueValidator

User = get_user_model()

class Assessment(models.Model):
    ASSESSMENT_TYPES = (
        ('parent', 'Parent Assessment'),
        ('child', 'Child Assessment'),
        ('teen', 'Teen Assessment'),
    )
    TIER_CHOICES = (
        ('free', 'Free'),
        ('paid', 'Paid'),
    )
    
    assessment_type = models.CharField(max_length=20, choices=ASSESSMENT_TYPES)
    stage = models.CharField(max_length=50)
    tier = models.CharField(max_length=10, choices=TIER_CHOICES, default='free')
    title = models.CharField(max_length=200)
    description = models.TextField()
    questions = models.JSONField(default=list)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.get_assessment_type_display()} - {self.stage} ({self.tier})"

class AssessmentResult(models.Model):
    RISK_LEVELS = (
        ('low', 'Low Risk'),
        ('moderate', 'Moderate Risk'),
        ('high', 'High Risk'),
    )
    
    assessment = models.ForeignKey(Assessment, on_delete=models.CASCADE)
    user = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True)
    child = models.ForeignKey('children.Child', on_delete=models.CASCADE, 
                              null=True, blank=True)
    
    health_score = models.FloatField(validators=[MinValueValidator(0), MaxValueValidator(100)])
    behavior_score = models.FloatField(validators=[MinValueValidator(0), MaxValueValidator(100)])
    routine_score = models.FloatField(validators=[MinValueValidator(0), MaxValueValidator(100)])
    emotional_score = models.FloatField(validators=[MinValueValidator(0), MaxValueValidator(100)])
    
    final_score = models.FloatField(validators=[MinValueValidator(0), MaxValueValidator(100)])
    weighted_score = models.FloatField(validators=[MinValueValidator(0), MaxValueValidator(100)])
    risk_level = models.CharField(max_length=20, choices=RISK_LEVELS)
    
    answers = models.JSONField(default=dict)
    strengths = models.JSONField(default=list)
    improvements = models.JSONField(default=list)
    recommendations = models.JSONField(default=list)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        user_ref = self.user.email if self.user else self.child.name
        return f"{user_ref} - {self.final_score}%"

class CareerDiscoveryResult(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True)
    child = models.ForeignKey('children.Child', on_delete=models.CASCADE, 
                              null=True, blank=True)
    
    # Results data
    trait_labels = models.JSONField(default=list)
    scores = models.JSONField(default=dict)
    
    best_career_title = models.CharField(max_length=200)
    best_career_emoji = models.CharField(max_length=10, blank=True)
    best_career_why = models.TextField(blank=True)
    
    alternatives = models.JSONField(default=list)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
        
    def __str__(self):
        user_ref = self.user.email if self.user else (self.child.name if self.child else "Unknown")
        return f"{user_ref} - {self.best_career_title}"
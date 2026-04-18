from django.db import models
from django.conf import settings
from apps.children.models import Child

User = settings.AUTH_USER_MODEL

class RelationshipState(models.Model):
    MODE_CHOICES = (
        ('normal', 'Normal'),
        ('trust_rebuilding', 'Trust Rebuilding'),
        ('resistance_handling', 'Resistance Handling'),
    )
    parent = models.ForeignKey(User, on_delete=models.CASCADE, related_name='rel_parent_states')
    child = models.ForeignKey(Child, on_delete=models.CASCADE, related_name='rel_states')
    trust_score = models.IntegerField(default=50)           # 0-100
    engagement_level = models.CharField(max_length=10, choices=(('high','High'),('medium','Medium'),('low','Low')), default='medium')
    current_mode = models.CharField(max_length=20, choices=MODE_CHOICES, default='normal')
    last_updated = models.DateTimeField(auto_now=True)
    engagement_history = models.JSONField(default=list)     # list of {date, level}
    trust_history = models.JSONField(default=list)          # list of {date, score}

    class Meta:
        unique_together = ('parent', 'child')

class MoodCheckIn(models.Model):
    MOOD_CHOICES = (
        ('happy', 'Happy'),
        ('neutral', 'Neutral'),
        ('low', 'Low'),
        ('stressed', 'Stressed'),
    )
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='mood_checkins')
    child = models.ForeignKey(Child, on_delete=models.CASCADE, null=True, blank=True)  # optional context
    mood = models.CharField(max_length=10, choices=MOOD_CHOICES)
    notes = models.TextField(blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)

class BehaviorSignal(models.Model):
    SIGNAL_TYPES = (
        ('response_delay', 'Response Delay'),
        ('skipped_interaction', 'Skipped Interaction'),
        ('app_usage', 'App Usage'),
        ('negative_feedback', 'Negative Feedback'),
    )
    parent = models.ForeignKey(User, on_delete=models.CASCADE, related_name='behavior_signals')
    child = models.ForeignKey(Child, on_delete=models.CASCADE)
    signal_type = models.CharField(max_length=20, choices=SIGNAL_TYPES)
    value = models.JSONField(default=dict)   # e.g. {"delay_minutes": 120, "app_name": "YouTube"}
    timestamp = models.DateTimeField(auto_now_add=True)

class InteractionLog(models.Model):
    parent = models.ForeignKey(User, on_delete=models.CASCADE, related_name='rel_interactions')
    child = models.ForeignKey(Child, on_delete=models.CASCADE)
    suggested_action = models.JSONField()     # store the full recommendation output
    action_taken = models.CharField(max_length=50, blank=True)  # 'followed', 'ignored', 'modified'
    outcome = models.CharField(max_length=10, choices=(('positive','Positive'),('neutral','Neutral'),('negative','Negative')), null=True)
    mode_before = models.CharField(max_length=20)
    mode_after = models.CharField(max_length=20)
    created_at = models.DateTimeField(auto_now_add=True)

class ParentActionFeedback(models.Model):
    parent = models.ForeignKey(User, on_delete=models.CASCADE)
    child = models.ForeignKey(Child, on_delete=models.CASCADE)
    interaction = models.ForeignKey(InteractionLog, on_delete=models.CASCADE, null=True)
    followed = models.BooleanField(default=False)
    outcome_rating = models.IntegerField(null=True, blank=True)  # 1-5
    corrective_tip_given = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)


# backend/apps/relationship_intelligence/models.py

from django.db import models
from django.conf import settings
from apps.children.models import Child

User = settings.AUTH_USER_MODEL

# ... existing models (RelationshipState, MoodCheckIn, etc.) ...

class RelationshipAnalysis(models.Model):
    """
    Stores the full AI-generated relationship intelligence report for a parent-child pair.
    """
    parent = models.ForeignKey(User, on_delete=models.CASCADE, related_name='rel_analyses')
    child = models.ForeignKey(Child, on_delete=models.CASCADE, related_name='rel_analyses')
    
    # Input data (what the user submitted)
    parent_input = models.JSONField()   # { mood, thoughts, problem }
    child_input = models.JSONField()    # { mood, thoughts, problem }
    
    # Full AI response (the JSON returned by Gemini)
    analysis_result = models.JSONField()
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Analysis for {self.child.name} on {self.created_at.date()}"

class MagicFixHistory(models.Model):
    parent = models.ForeignKey(User, on_delete=models.CASCADE, related_name='magic_fixes')
    child = models.ForeignKey(Child, on_delete=models.CASCADE, related_name='magic_fixes')
    
    problem = models.TextField(blank=True)
    behavior = models.TextField(blank=True)
    mood = models.CharField(max_length=50, blank=True)
    context = models.TextField(blank=True)
    
    fix_result = models.JSONField()
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
        
    def __str__(self):
        return f"Magic Fix for {self.child.name} on {self.created_at.date()}"
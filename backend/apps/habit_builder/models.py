from django.db import models
from django.conf import settings
from apps.children.models import Child

User = settings.AUTH_USER_MODEL


class Habit(models.Model):
    REPETITION_CHOICES = (
        ('daily', 'Daily'),
        ('weekly', 'Weekly'),
    )
    APPROVAL_CHOICES = (
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
        ('modified', 'Modified'),
    )
    STAGE_CHOICES = (
        ('not_started', 'Not Started'),
        ('building', 'Building'),
        ('formed', 'Formed'),
    )

    # Relationships
    creator = models.ForeignKey(User, on_delete=models.CASCADE, related_name='created_habits')
    parent = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True,
                               related_name='parent_habits', help_text="The parent who created/monitors this habit (if any)")
    teen = models.ForeignKey(User, on_delete=models.CASCADE, related_name='teen_habits',
                             help_text="The teen this habit belongs to")
    # Core fields
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True, default='')
    duration_minutes = models.PositiveIntegerField(default=10, help_text="Duration in minutes (2–20)")
    suggested_time = models.TimeField(null=True, blank=True)
    repetition = models.CharField(max_length=10, choices=REPETITION_CHOICES, default='daily')
    
    # Approval workflow (for parent-created tasks)
    created_by = models.CharField(max_length=10, choices=(('parent', 'Parent'), ('teen', 'Teen')))
    approval_status = models.CharField(max_length=10, choices=APPROVAL_CHOICES, default='approved')
    teen_feedback = models.TextField(blank=True, default='')
    adjusted_task = models.CharField(max_length=255, blank=True, default='',
                                     help_text="Modified task title suggested after review")
    ai_feasibility = models.CharField(max_length=50, blank=True, default='')
    ai_suggestion = models.TextField(blank=True, default='')
    
    # Habit building
    stage = models.CharField(max_length=15, choices=STAGE_CHOICES, default='not_started')
    streak = models.PositiveIntegerField(default=0)
    best_streak = models.PositiveIntegerField(default=0)
    total_completions = models.PositiveIntegerField(default=0)
    points_earned = models.PositiveIntegerField(default=0)
    
    # Status
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.title} ({self.get_approval_status_display()})"


class HabitLog(models.Model):
    habit = models.ForeignKey(Habit, on_delete=models.CASCADE, related_name='logs')
    completed_at = models.DateTimeField(auto_now_add=True)
    completed_date = models.DateField(auto_now_add=True, help_text="Date only, for streak tracking")
    checked_by = models.CharField(max_length=10, choices=(('manual', 'Manual'), ('auto', 'Auto')), default='manual')
    notes = models.TextField(blank=True, default='')

    class Meta:
        ordering = ['-completed_at']
        unique_together = ('habit', 'completed_date')

    def __str__(self):
        return f"{self.habit.title} - {self.completed_date}"


class HabitReward(models.Model):
    REWARD_TYPES = (
        ('instant', 'Instant'),
        ('streak', 'Streak Bonus'),
        ('milestone', 'Milestone'),
    )
    habit = models.ForeignKey(Habit, on_delete=models.CASCADE, related_name='rewards')
    reward_type = models.CharField(max_length=15, choices=REWARD_TYPES)
    title = models.CharField(max_length=100)
    description = models.TextField(blank=True, default='')
    points = models.PositiveIntegerField(default=0)
    badge_emoji = models.CharField(max_length=10, blank=True, default='')
    unlocked_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-unlocked_at']

    def __str__(self):
        return f"{self.habit.title} - {self.title}"
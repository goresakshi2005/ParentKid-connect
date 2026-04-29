from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()


class Habit(models.Model):
    """
    Represents a habit (light task) that can be created by either a parent or teen.
    Parent-created habits require teen approval before becoming active.
    """

    CREATOR_CHOICES = (
        ('parent', 'Parent'),
        ('teen', 'Teen'),
    )
    APPROVAL_CHOICES = (
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
        ('modified', 'Modified'),
    )
    REPETITION_CHOICES = (
        ('daily', 'Daily'),
        ('weekly', 'Weekly'),
    )
    STAGE_CHOICES = (
        ('not_started', 'Not Started'),
        ('building', 'Building'),
        ('formed', 'Formed'),
    )

    # Core fields
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True, default='')
    duration_minutes = models.PositiveIntegerField(default=10,
        help_text='Duration in minutes')
    suggested_time = models.TimeField(null=True, blank=True)
    repetition = models.CharField(max_length=10, choices=REPETITION_CHOICES,
        default='daily')

    # Ownership
    created_by = models.CharField(max_length=10, choices=CREATOR_CHOICES)
    creator = models.ForeignKey(User, on_delete=models.CASCADE,
        related_name='created_habits')
    teen = models.ForeignKey(User, on_delete=models.CASCADE,
        related_name='teen_habits',
        help_text='The teen this habit belongs to')
    parent = models.ForeignKey(User, on_delete=models.SET_NULL,
        related_name='parent_habits', null=True, blank=True,
        help_text='The parent who created/monitors this habit (if any)')

    # Approval system (only relevant for parent-created habits)
    approval_status = models.CharField(max_length=10, choices=APPROVAL_CHOICES,
        default='approved')
    teen_feedback = models.TextField(blank=True, default='')
    adjusted_task = models.CharField(max_length=255, blank=True, default='',
        help_text='Modified task title suggested after review')

    # AI analysis
    ai_feasibility = models.CharField(max_length=50, blank=True, default='')
    ai_suggestion = models.TextField(blank=True, default='')

    # Habit tracking
    stage = models.CharField(max_length=15, choices=STAGE_CHOICES,
        default='not_started')
    streak = models.PositiveIntegerField(default=0)
    best_streak = models.PositiveIntegerField(default=0)
    total_completions = models.PositiveIntegerField(default=0)
    points_earned = models.PositiveIntegerField(default=0)

    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.teen.email} – {self.title} ({self.stage})"

    def update_stage(self):
        """Update habit stage based on streak count."""
        if self.streak >= 7:
            self.stage = 'formed'
        elif self.streak >= 1:
            self.stage = 'building'
        else:
            self.stage = 'not_started'


class HabitLog(models.Model):
    """
    Records each completion/check-in for a habit.
    """
    CHECK_CHOICES = (
        ('manual', 'Manual'),
        ('auto', 'Auto'),
    )

    habit = models.ForeignKey(Habit, on_delete=models.CASCADE,
        related_name='logs')
    completed_at = models.DateTimeField(auto_now_add=True)
    completed_date = models.DateField(auto_now_add=True,
        help_text='Date only, for streak tracking')
    checked_by = models.CharField(max_length=10, choices=CHECK_CHOICES,
        default='manual')
    notes = models.TextField(blank=True, default='')

    class Meta:
        ordering = ['-completed_at']
        unique_together = ('habit', 'completed_date')  # one check-in per day

    def __str__(self):
        return f"{self.habit.title} – {self.completed_date}"


class HabitReward(models.Model):
    """
    Tracks rewards earned for habit completions and streaks.
    """
    REWARD_TYPE_CHOICES = (
        ('instant', 'Instant'),
        ('streak', 'Streak Bonus'),
        ('milestone', 'Milestone'),
    )

    habit = models.ForeignKey(Habit, on_delete=models.CASCADE,
        related_name='rewards')
    reward_type = models.CharField(max_length=15, choices=REWARD_TYPE_CHOICES)
    title = models.CharField(max_length=100)
    description = models.TextField(blank=True, default='')
    points = models.PositiveIntegerField(default=0)
    badge_emoji = models.CharField(max_length=10, blank=True, default='')
    unlocked_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-unlocked_at']

    def __str__(self):
        return f"{self.title} – {self.points} pts"

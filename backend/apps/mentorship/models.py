from django.db import models
from django.conf import settings


class Mentor(models.Model):
    """
    Mentor profile — linked to a CustomUser with role='mentor'.
    Each mentor can specialise in one or more stages.
    """
    STAGE_CHOICES = (
        ('pregnancy', 'Before Birth / Pregnancy'),
        ('early_childhood', 'Early Childhood (0-5)'),
        ('growing_stage', 'Growing Stage (6-12)'),
        ('teen_age', 'Teenager (13-21)'),
    )

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='mentor_profile',
    )
    specialization = models.CharField(
        max_length=20,
        choices=STAGE_CHOICES,
        help_text='Primary stage this mentor covers',
    )
    bio = models.TextField(blank=True)
    is_available = models.BooleanField(default=True)
    max_clients = models.PositiveIntegerField(default=10)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['user__first_name']

    def __str__(self):
        return f"Mentor: {self.user.get_full_name()} ({self.get_specialization_display()})"

    @property
    def active_client_count(self):
        return self.assignments.filter(is_active=True).count()

    @property
    def has_capacity(self):
        return self.active_client_count < self.max_clients


class MentorAssignment(models.Model):
    """
    Links a user (parent/teen) to a mentor.
    Stage is stored so we can match the right mentor.
    """
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='mentor_assignments',
    )
    mentor = models.ForeignKey(
        Mentor,
        on_delete=models.CASCADE,
        related_name='assignments',
    )
    stage = models.CharField(max_length=20, choices=Mentor.STAGE_CHOICES)
    is_active = models.BooleanField(default=True)
    assigned_at = models.DateTimeField(auto_now_add=True)
    deactivated_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-assigned_at']

    def __str__(self):
        return f"{self.user.get_full_name()} → {self.mentor.user.get_full_name()}"


class ChatMessage(models.Model):
    """
    One-to-one messages between user and mentor.
    """
    assignment = models.ForeignKey(
        MentorAssignment,
        on_delete=models.CASCADE,
        related_name='messages',
    )
    sender = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='sent_messages',
    )
    receiver = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='received_messages',
    )
    message = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)
    is_read = models.BooleanField(default=False)

    class Meta:
        ordering = ['timestamp']

    def __str__(self):
        preview = self.message[:40] + ('…' if len(self.message) > 40 else '')
        return f"{self.sender.first_name} → {self.receiver.first_name}: {preview}"

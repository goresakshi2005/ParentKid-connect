from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()


class StudyTask(models.Model):
    TASK_TYPES = (
        ('Task', 'Task'),
        ('Meeting', 'Meeting'),
        ('Test/Exam', 'Test/Exam'),
        ('Assignment/Deadline', 'Assignment/Deadline'),
    )
    PRIORITY_CHOICES = (
        ('Low', 'Low'),
        ('Medium', 'Medium'),
        ('High', 'High'),
    )
    STATUS_CHOICES = (
        ('Pending', 'Pending'),
        ('Completed', 'Completed'),
    )

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='study_tasks')
    title = models.CharField(max_length=255)
    task_type = models.CharField(max_length=30, choices=TASK_TYPES)
    date = models.DateField()
    time = models.TimeField(null=True, blank=True)
    deadline = models.BooleanField(default=False)
    reminder = models.CharField(max_length=50)   # e.g. "30 minutes before"
    priority = models.CharField(max_length=10, choices=PRIORITY_CHOICES, default='Medium')
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='Pending')

    # raw voice input stored for reference
    voice_input = models.TextField(blank=True, default='')

    # structured JSON from AI parser
    parsed_json = models.JSONField(default=dict)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['date', 'time']

    def __str__(self):
        return f"{self.user.email} – {self.title} ({self.date})"
from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()


class Insight(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='insights')
    title = models.CharField(max_length=200, blank=True)
    content = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Insight for {self.user.email} - {self.created_at}"
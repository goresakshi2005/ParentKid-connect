from django.db import models
from django.contrib.auth.models import AbstractUser

class CustomUser(AbstractUser):
    ROLE_CHOICES = (
        ('parent', 'Parent'),
        ('teen', 'Teen'),
    )
    
    role = models.CharField(max_length=10, choices=ROLE_CHOICES)
    phone = models.CharField(max_length=20, blank=True)
    avatar = models.ImageField(upload_to='avatars/', null=True, blank=True)
    bio = models.TextField(blank=True)
    is_expecting = models.BooleanField(default=False)  # True for pregnancy/expecting parents
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    # ✅ Google OAuth tokens — required for Google Calendar integration
    google_access_token = models.TextField(blank=True, null=True)
    google_refresh_token = models.TextField(blank=True, null=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.get_full_name()} ({self.role})"

class ParentTeenLink(models.Model):
    parent = models.ForeignKey(CustomUser, on_delete=models.CASCADE, 
                               related_name='teen_links')
    teen = models.ForeignKey(CustomUser, on_delete=models.CASCADE, 
                             related_name='parent_links')
    invite_code = models.CharField(max_length=10, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    accepted_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        unique_together = ('parent', 'teen')
    
    def __str__(self):
        return f"{self.parent.email} -> {self.teen.email}"
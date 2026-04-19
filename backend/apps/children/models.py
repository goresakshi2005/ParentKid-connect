from django.db import models
from django.contrib.auth import get_user_model
import secrets
import string

User = get_user_model()

class Child(models.Model):
    STAGE_CHOICES = (
        ('pregnancy', 'Pregnancy'),
        ('early_childhood', 'Early Childhood (0-5)'),
        ('growing_stage', 'Growing (6-12)'),
        ('teen_age', 'Teen (13-21)'),                     # updated range
    )
    
    parent = models.ForeignKey(User, on_delete=models.CASCADE, 
                               related_name='children')
    name = models.CharField(max_length=100)
    date_of_birth = models.DateField()
    avatar = models.ImageField(upload_to='child_avatars/', null=True, blank=True)
    stage = models.CharField(max_length=20, choices=STAGE_CHOICES, default='early_childhood')  # added default
    invite_code = models.CharField(max_length=10, unique=True, blank=True, null=True)
    firebase_id = models.CharField(max_length=255, unique=True, blank=True, null=True)
    email = models.EmailField(unique=True, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['name']
    
    def save(self, *args, **kwargs):
        # If stage is not 'pregnancy', automatically set it based on age
        if self.stage != 'pregnancy':
            age = self.get_age()
            if age <= 5:
                self.stage = 'early_childhood'
            elif age <= 12:
                self.stage = 'growing_stage'
            elif age <= 21:               # updated to 21
                self.stage = 'teen_age'
            else:
                self.stage = 'teen_age'   # fallback for ages > 21

        # Generate invite code for teen children
        if not self.invite_code and self.stage == 'teen_age':
            alphabet = string.ascii_uppercase + string.digits
            while True:
                code = ''.join(secrets.choice(alphabet) for i in range(8))
                if not Child.objects.filter(invite_code=code).exists():
                    self.invite_code = code
                    break
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"{self.name} (Parent: {self.parent.email})"
    
    def get_age(self):
        from datetime import date
        today = date.today()
        return today.year - self.date_of_birth.year - \
               ((today.month, today.day) < (self.date_of_birth.month, self.date_of_birth.day))
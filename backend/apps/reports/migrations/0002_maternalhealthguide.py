"""
backend/apps/reports/migrations/0002_maternalhealthguide.py

Adds the MaternalHealthGuide model to store AI-generated guides
linked to MedicalReport records.
"""

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ("reports", "0001_initial"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="MaternalHealthGuide",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                (
                    "report",
                    models.OneToOneField(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="health_guide",
                        to="reports.medicalreport",
                    ),
                ),
                (
                    "user",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="health_guides",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
                ("trimester", models.CharField(blank=True, max_length=50)),
                ("guide_text", models.TextField()),
                ("overall_status", models.TextField(blank=True)),
                ("positives", models.JSONField(default=list)),
                ("issues", models.JSONField(default=list)),
                ("recommendations", models.JSONField(default=dict)),
                ("care_goals", models.JSONField(default=list)),
                ("alerts", models.TextField(blank=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
            ],
        ),
    ]
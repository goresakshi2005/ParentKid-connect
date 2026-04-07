# backend/apps/screen_monitor/migrations/0001_initial.py

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='Device',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('device_name', models.CharField(max_length=100)),
                ('device_id', models.CharField(max_length=255, unique=True)),
                ('registered_at', models.DateTimeField(auto_now_add=True)),
                ('last_sync', models.DateTimeField(blank=True, null=True)),
                ('user', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='devices',
                    to=settings.AUTH_USER_MODEL,
                )),
            ],
            options={'ordering': ['-registered_at']},
        ),
        migrations.CreateModel(
            name='AppUsage',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('app_name', models.CharField(max_length=255)),
                ('package_name', models.CharField(max_length=255)),
                ('usage_time', models.PositiveIntegerField()),
                ('date', models.DateField()),
                ('timestamp', models.DateTimeField(auto_now_add=True)),
                ('device', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='app_usages',
                    to='screen_monitor.device',
                )),
            ],
            options={'ordering': ['-date', '-usage_time']},
        ),
        migrations.AddConstraint(
            model_name='appusage',
            constraint=models.UniqueConstraint(
                fields=['device', 'package_name', 'date'],
                name='unique_app_usage_per_day'
            ),
        ),
    ]
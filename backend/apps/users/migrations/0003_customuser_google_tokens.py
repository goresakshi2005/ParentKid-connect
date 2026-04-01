from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0002_customuser_is_expecting'),
    ]

    operations = [
        migrations.AddField(
            model_name='customuser',
            name='google_access_token',
            field=models.TextField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='customuser',
            name='google_refresh_token',
            field=models.TextField(blank=True, null=True),
        ),
    ]
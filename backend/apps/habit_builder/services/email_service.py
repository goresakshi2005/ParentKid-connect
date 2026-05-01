from django.core.mail import send_mail
from django.conf import settings
from django.template.loader import render_to_string
from django.utils.html import strip_tags


def send_task_completed_email(parent_email, teen_name, habit):
    """Send email notification when a teen completes a task."""
    subject = f"✅ Task completed: {habit.title}"
    html_message = render_to_string('habit_builder/email_completion.html', {
        'teen_name': teen_name,
        'habit': habit,
        'streak': habit.streak,
        'points': habit.points_earned
    })
    plain_message = strip_tags(html_message)

    send_mail(
        subject,
        plain_message,
        settings.DEFAULT_FROM_EMAIL,
        [parent_email],
        html_message=html_message,
        fail_silently=False,
    )
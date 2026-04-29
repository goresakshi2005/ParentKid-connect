"""
Email notification service for the Habit Builder.
Sends email to the parent when a teen completes a habit.
Uses Django's built-in email backend (console in dev, SMTP in prod).
"""

import logging
from django.core.mail import send_mail
from django.conf import settings

logger = logging.getLogger(__name__)


def send_habit_completion_email(habit, streak):
    """
    Send an email notification to the linked parent when a teen completes a habit.

    Args:
        habit: The Habit model instance
        streak: Current streak count
    """
    if not habit.parent:
        logger.info(f"No parent linked to habit {habit.id} — skipping email.")
        return False

    parent = habit.parent
    teen = habit.teen
    teen_name = teen.get_full_name() or teen.email

    # Determine streak emoji
    if streak >= 7:
        streak_badge = "🏆 HABIT FORMED!"
    elif streak >= 5:
        streak_badge = "🔥 On Fire!"
    elif streak >= 3:
        streak_badge = "⭐ Rising Star!"
    else:
        streak_badge = "✨ Great Start!"

    subject = f"🎉 {teen_name} completed \"{habit.title}\" — {streak_badge}"

    message = f"""
Hi {parent.get_full_name() or 'Parent'},

Great news! Your teen {teen_name} just completed their habit:

📋 Habit: {habit.title}
✅ Status: Completed
🔥 Current Streak: {streak} day(s)
📊 Stage: {habit.get_stage_display()}
⏱️ Duration: {habit.duration_minutes} minutes

{streak_badge}

{_get_appreciation_message(streak)}

Keep encouraging them — consistency is the key to forming lasting habits!

Warm regards,
ParentKid Connect
"""

    try:
        send_mail(
            subject=subject,
            message=message.strip(),
            from_email=getattr(settings, 'DEFAULT_FROM_EMAIL',
                               'noreply@parentkidconnect.com'),
            recipient_list=[parent.email],
            fail_silently=True,
        )
        logger.info(f"Sent habit completion email to {parent.email} for habit {habit.id}")
        return True
    except Exception as e:
        logger.error(f"Failed to send habit completion email: {e}")
        return False


def _get_appreciation_message(streak):
    """Return a motivational message based on streak length."""
    if streak >= 7:
        return (
            "🎊 AMAZING! This habit is now officially FORMED! "
            "Your teen has been consistent for 7+ days. "
            "This is a huge milestone — celebrate together!"
        )
    elif streak >= 5:
        return (
            "🚀 Incredible progress! Just 2 more days to form this habit permanently. "
            "Your teen is showing real dedication!"
        )
    elif streak >= 3:
        return (
            "⭐ Wonderful consistency! A 3-day streak shows real commitment. "
            "The habit is building momentum!"
        )
    else:
        return (
            "💪 Every step counts! Encourage your teen to keep going. "
            "Habits are built one day at a time."
        )

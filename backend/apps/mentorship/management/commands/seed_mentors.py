"""
Management command to create demo mentor users.
Usage:  python manage.py seed_mentors
"""
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from apps.mentorship.models import Mentor

User = get_user_model()

DEMO_MENTORS = [
    {
        'email': 'mentor.pregnancy@demo.com',
        'first_name': 'Dr. Sarah',
        'last_name': 'Williams',
        'specialization': 'pregnancy',
        'bio': 'Certified prenatal counsellor with 12 years of experience supporting expecting parents through every stage of pregnancy.',
    },
    {
        'email': 'mentor.earlychildhood@demo.com',
        'first_name': 'Emily',
        'last_name': 'Johnson',
        'specialization': 'early_childhood',
        'bio': 'Child development specialist focused on early learning, motor skills, and emotional growth for children 0-5.',
    },
    {
        'email': 'mentor.growing@demo.com',
        'first_name': 'Michael',
        'last_name': 'Chen',
        'specialization': 'growing_stage',
        'bio': 'Expert in cognitive development, peer relationships, and academic growth for ages 6-12.',
    },
    {
        'email': 'mentor.teen@demo.com',
        'first_name': 'Priya',
        'last_name': 'Sharma',
        'specialization': 'teen_age',
        'bio': 'Adolescent counsellor specializing in identity, career guidance, and parent-teen communication.',
    },
]


class Command(BaseCommand):
    help = 'Create demo mentor accounts for each stage'

    def handle(self, *args, **options):
        created_count = 0
        for m in DEMO_MENTORS:
            user, user_created = User.objects.get_or_create(
                email=m['email'],
                defaults={
                    'username': m['email'],
                    'first_name': m['first_name'],
                    'last_name': m['last_name'],
                    'role': 'mentor',
                },
            )
            if user_created:
                user.set_password('demo1234')
                user.save()

            mentor, mentor_created = Mentor.objects.get_or_create(
                user=user,
                defaults={
                    'specialization': m['specialization'],
                    'bio': m['bio'],
                    'is_available': True,
                    'max_clients': 10,
                },
            )
            if mentor_created:
                created_count += 1
                self.stdout.write(self.style.SUCCESS(
                    f'  ✅ Created mentor: {user.get_full_name()} ({m["specialization"]})'
                ))
            else:
                self.stdout.write(f'  ⏭  Mentor already exists: {user.email}')

        self.stdout.write(self.style.SUCCESS(
            f'\nDone! Created {created_count} new mentor(s).'
        ))

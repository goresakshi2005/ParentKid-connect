from django.core.management.base import BaseCommand
from apps.subscriptions.models import Feature, SubscriptionPlan

class Command(BaseCommand):
    help = 'Seed features and subscription plans'

    def handle(self, *args, **kwargs):
        # 1. Create Features
        features_data = [
            ("growth_tracking", "Growth Tracking"),
            ("mentor_chat", "Mentor Chat"),
            ("assessment", "Assessment"),
            ("magic_fix", "Magic Fix"),
            ("career_discovery", "Career Discovery"),
            ("mental_health_guide", "Mental Health Guide"),
            ("study_planner", "Study Planner"),
            ("screen_intelligence", "Screen Intelligence"),
            ("relationship_ai", "Relationship AI"),
            ("appointment", "Appointment"),
            ("voice_wellness", "Voice Wellness"),
        ]

        features_obj = {}
        for name, desc in features_data:
            feature, created = Feature.objects.get_or_create(name=name, defaults={"description": desc})
            features_obj[name] = feature
            if created:
                self.stdout.write(self.style.SUCCESS(f"Feature '{name}' created."))

        # 2. Create Plans with updated feature sets
        # career_discovery removed from free plan, added to starter/growth/family
        plans_data = [
            {
                "name": "free",
                "price": 0,
                "features": ["growth_tracking", "mentor_chat", "assessment"]
            },
            {
                "name": "starter",
                "price": 500,
                "features": ["growth_tracking", "mentor_chat", "assessment", "career_discovery", "magic_fix"]
            },
            {
                "name": "growth",
                "price": 1000,
                "features": ["growth_tracking", "mentor_chat", "assessment", "magic_fix", "career_discovery", "mental_health_guide", "study_planner"]
            },
            {
                "name": "family",
                "price": 2000,
                "features": ["growth_tracking", "mentor_chat", "assessment", "magic_fix", "career_discovery", "mental_health_guide", "study_planner", "screen_intelligence", "relationship_ai", "appointment", "voice_wellness"]
            },
        ]

        for p_data in plans_data:
            plan, created = SubscriptionPlan.objects.get_or_create(
                plan_name=p_data["name"],
                defaults={"price": p_data["price"]}
            )
            # Update price if it changed
            if not created:
                plan.price = p_data["price"]
                plan.save()

            # Set features
            plan_features = [features_obj[f_name] for f_name in p_data["features"]]
            plan.features.set(plan_features)

            status = "created" if created else "updated"
            self.stdout.write(self.style.SUCCESS(f"Plan '{p_data['name']}' {status} with {len(p_data['features'])} features."))

        self.stdout.write(self.style.SUCCESS("Database seeded successfully!"))
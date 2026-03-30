from django.db import migrations

def create_plans(apps, schema_editor):
    SubscriptionPlan = apps.get_model('subscriptions', 'SubscriptionPlan')
    plans = [
        {'plan_name': 'free', 'price': 0, 'duration_days': 30, 'max_child_profiles': 1, 'unlimited_assessments': False, 'detailed_insights': False, 'personalized_recommendations': False, 'downloadable_reports': False, 'priority_support': False},
        {'plan_name': 'starter', 'price': 500, 'duration_days': 30, 'max_child_profiles': 1, 'unlimited_assessments': False, 'detailed_insights': False, 'personalized_recommendations': False, 'downloadable_reports': False, 'priority_support': False},
        {'plan_name': 'growth', 'price': 1000, 'duration_days': 30, 'max_child_profiles': 3, 'unlimited_assessments': True, 'detailed_insights': True, 'personalized_recommendations': True, 'downloadable_reports': False, 'priority_support': False},
        {'plan_name': 'family', 'price': 2000, 'duration_days': 30, 'max_child_profiles': 999, 'unlimited_assessments': True, 'detailed_insights': True, 'personalized_recommendations': True, 'downloadable_reports': True, 'priority_support': True},
    ]
    for p in plans:
        SubscriptionPlan.objects.create(**p)

def reverse_plans(apps, schema_editor):
    SubscriptionPlan = apps.get_model('subscriptions', 'SubscriptionPlan')
    SubscriptionPlan.objects.all().delete()

class Migration(migrations.Migration):
    dependencies = [
        ('subscriptions', '0002_initial'),
    ]
    operations = [
        migrations.RunPython(create_plans, reverse_plans),
    ]
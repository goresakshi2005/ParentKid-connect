from django.core.management.base import BaseCommand
from apps.children.models import Child
from apps.relationship_intelligence.models import RelationshipState

class Command(BaseCommand):
    help = 'Create RelationshipState for all existing parent-child pairs'

    def handle(self, *args, **options):
        children = Child.objects.all()
        created = 0
        for child in children:
            obj, c = RelationshipState.objects.get_or_create(parent=child.parent, child=child)
            if c:
                created += 1
        self.stdout.write(self.style.SUCCESS(f'Created {created} relationship states.'))
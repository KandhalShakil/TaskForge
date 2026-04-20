from django.core.management.base import BaseCommand

from apps.core.mongo import ensure_indexes


class Command(BaseCommand):
    help = 'Ensure MongoDB indexes for Takify collections.'

    def handle(self, *args, **options):
        ensure_indexes()
        self.stdout.write(self.style.SUCCESS('MongoDB indexes ensured.'))

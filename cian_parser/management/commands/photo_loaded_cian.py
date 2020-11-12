from django.core.management.base import BaseCommand
from cian_parser.cian_photo_parser import main as photo_main


class Command(BaseCommand):
    help = 'photo_loaded'

    def handle(self, *args, **options):
        photo_main()


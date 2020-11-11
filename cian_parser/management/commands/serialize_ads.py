from django.core.management.base import BaseCommand
from cian_parser.serialize_ads import main as serialize_main


class Command(BaseCommand):
    help = 'serialize ads'

    def handle(self, *args, **options):
        serialize_main()


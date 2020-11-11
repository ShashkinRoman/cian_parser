from django.core.management.base import BaseCommand
from cian_parser.urls_parser import main as urls_main


class Command(BaseCommand):
    help = 'urls parser'

    def handle(self, *args, **options):
        urls_main()

from django.core.management.base import BaseCommand

from cian_parser.ads_parser_selenium import main as ads_main


class Command(BaseCommand):
    help = 'urls parser'

    def handle(self, *args, **options):
        ads_main()

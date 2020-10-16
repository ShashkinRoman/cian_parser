from django.core.management.base import BaseCommand

from cian_parser.ads_parser_selenium import main as ads_main


class Command(BaseCommand):
    help = 'urls parser: -upc, --urls_parser_cian, ads parser: -apc, --ads_parser_cian'

    def handle(self, *args, **options):
        if options['ads_parser_cian']:
            ads_main()
        else:
            print('argument is not found')

    def add_arguments(self, parser):
        parser.add_argument(
            '-apc',
            '--ads_parser_cian',
            action='store_true',
            default=False,
            help='Вывод короткого сообщения'
        )

from django.core.management.base import BaseCommand

from cian_parser.ads_parser_selenium import main as ads_main


class Command(BaseCommand):
    help = 'urls parser: -up, --urls_parser, ads parser: -ap, --ads_parser'

    def handle(self, *args, **options):
        if options['ads_parser']:
            ads_main()
        else:
            print('argument is not found')

    def add_arguments(self, parser):
        parser.add_argument(
            '-ap',
            '--ads_parser',
            action='store_true',
            default=False,
            help='Вывод короткого сообщения'
        )

from django.core.management.base import BaseCommand
from cian_parser.urls_parser import main as urls_main


class Command(BaseCommand):
    help = 'urls parser: -upc, --urls_parser_cian, ads parser: -apc, --ads_parser_cian'

    def handle(self, *args, **options):
        if options['urls_parser_cian']:
            urls_main()
        else:
            print('argument is not found')

    def add_arguments(self, parser):
        parser.add_argument(
        '-upc',
        '--urls_parser_cian',
        action='store_true',
        default=False,
        help='Вывод короткого сообщения'
        )

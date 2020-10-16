from django.core.management.base import BaseCommand
from avitoparser.urls_parser_avito import main as urls_main
from cian_parser.ads_parser_selenium import main as ads_main


class Command(BaseCommand):
    help = 'urls parser: -upa, --urls_parser_avito, ads parser: -apa, --ads_parser_avito'

    def handle(self, *args, **options):
        if options['urls_parser_avito']:
            urls_main()
        else:
            print('argument is not found')

    def add_arguments(self, parser):
        parser.add_argument(
        '-upa',
        '--urls_parser_avito',
        action='store_true',
        default=False,
        help='Вывод короткого сообщения'
        )

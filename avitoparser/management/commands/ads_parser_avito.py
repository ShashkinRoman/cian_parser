from django.core.management.base import BaseCommand

from avitoparser.avito_parser_selen import main as ads_main


class Command(BaseCommand):
    help = 'urls parser: -upa, --urls_parser_avito, ads parser: -apa, --ads_parser_avito'

    def handle(self, *args, **options):
        if options['ads_parser_avito']:
            ads_main()
        else:
            print('argument is not found')

    def add_arguments(self, parser):
        parser.add_argument(
            '-apa',
            '--ads_parser_avito',
            action='store_true',
            default=False,
            help='Вывод короткого сообщения'
        )

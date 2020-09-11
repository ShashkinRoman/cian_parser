from django.core.management.base import BaseCommand

from cian_parser.webdriver.chrome_driver import Chromedriver


class Command(BaseCommand):
    help = 'test chrome driver: -cd, --chrome_driver'

    def handle(self, *args, **options):
        if options['chrome_driver']:
            driver_obj = Chromedriver()
            driver = driver_obj.start_driver()
            # driver = driver_obj.opera(start, path[0])
            url = 'https://2ip.ru/'
            driver.get(url)
            print(driver.find_element_by_class_name('ip').text)
        else:
            print('argument is not found')

    def add_arguments(self, parser):
        parser.add_argument(
            '-cd',
            '--chrome_driver',
            action='store_true',
            default=False,
            help='Вывод короткого сообщения'
        )

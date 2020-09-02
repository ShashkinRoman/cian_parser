import os
from selenium import webdriver
from selenium.webdriver.chrome import service
from dotenv import load_dotenv
from cian_parser.settings import BASE_DIR as bd
load_dotenv()


path = (str(bd) + os.getenv('opera_profile_one'),
        str(bd) + os.getenv('opera_profile_two'),
        str(bd) + str(bd) + os.getenv('opera_profile_three'),
        str(bd) + os.getenv('opera_profile_four'),
        str(bd) + os.getenv('opera_profile_five'))


class Operadriver():
    def start_driver(self, path=str(bd) + os.getenv('opera_driver_path')):
        webdriver_service = service.Service(path)
        webdriver_service.start()
        return webdriver_service

    def opera(self, webdriver_service, opera_profile):
        # opera_profile = os.getenv('opera_driver')
        options = webdriver.ChromeOptions()
        # options.add_argument('--headless')
        # options.headless = True
        options.add_argument('user-data-dir=' + opera_profile)
        driver = webdriver.Remote(webdriver_service.service_url, webdriver.DesiredCapabilities.OPERA, options=options)
        return driver

# driver_obj = Operadriver()
# start = driver_obj.start_driver()
# driver = driver_obj.opera(start, path[0])
# url = 'https://2ip.ru/'
# driver.get(url)
# print(driver.find_element_by_class_name('ip').text)
# driver.quit()

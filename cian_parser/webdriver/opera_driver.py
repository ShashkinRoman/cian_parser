import os
from selenium import webdriver
from selenium.webdriver.chrome import service
from dotenv import load_dotenv
load_dotenv()


path = (os.getenv('opera_profile_one'),
        os.getenv('opera_profile_two'),
        os.getenv('opera_profile_three'),
        os.getenv('opera_profile_four'),
        os.getenv('opera_profile_five')
        )


class Operadriver():
    def start_driver(self, path=os.getenv('opera_driver_path')):
        webdriver_service = service.Service(path)
        webdriver_service.start()
        return webdriver_service

    def opera(self, webdriver_service, opera_profile):
        # opera_profile = os.getenv('opera_driver')
        options = webdriver.ChromeOptions()
        options.add_argument('user-data-dir=' + opera_profile)
        driver = webdriver.Remote(webdriver_service.service_url, webdriver.DesiredCapabilities.OPERA, options=options)
        return driver


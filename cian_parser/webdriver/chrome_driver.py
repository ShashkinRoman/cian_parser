import os
from selenium.webdriver.chrome.options import Options
from selenium import webdriver
from selenium.webdriver.chrome import service
from cian_parser.settings import BASE_DIR as bd
from dotenv import load_dotenv

load_dotenv()


path = (os.getenv('chrome_profile_one'),
        # str(bd) + os.getenv('chrome_profile_one'),
        # str(bd) + os.getenv('chrome_profile_two'),
        # str(bd) + str(bd) + os.getenv('chrome_profile_three'),
        # str(bd) + os.getenv('chrome_profile_four'),
        # str(bd) + os.getenv('chrome_profile_five'),
        )


class Chromedriver():

    def start_driver(self, path=str(bd) + os.getenv('chrome_driver_path'),
                     chrome_profile=str(bd) + os.getenv('chrome_profile_one')):
        options = Options()
        prefs = {"profile.managed_default_content_settings.images": 2}
        options.binary_location = '/opt/google/chrome/google-chrome'
        options.add_experimental_option("prefs", prefs)
        options.add_argument('--headless')
        options.add_argument('-no-sandbox')
        # path_extension = '/home/roman/PycharmProjects/cian_parser/cian_parser/webdriver/chrome_driver/chrome_profile/google-chrome/Default/Extensions/hipncndjamdcmphkgngojegjblibadbe/1.6.1_0.crx'
        # options.add_extension(str(bd) + '/cian_parser/webdriver/chrome_driver/chrome_profile/google-chrome/Default/Extensions/bibjcjfmgapbfoljiojpipaooddpkpai/1.5_0.crx')
        # options.add_argument("load-extension=" + path_extension)
        options.add_argument('user-data-dir=' + chrome_profile)
        self.driver = webdriver.Chrome(executable_path=path, options=options)
        return self.driver
#
# driver_obj = Chromedriver()
# driver = driver_obj.start_driver()
# # driver = driver_obj.opera(start, path[0])
# url = 'https://2ip.ru/'
# driver.get(url)
# print(driver.find_element_by_class_name('ip').text)
# # driver.quit()
# '91.210.171.227'
# # '94.229.237.244'
# '178.62.106.169'

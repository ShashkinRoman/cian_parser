import json
import random
from time import sleep
# from datetime import datetime
# from cian_parser.utils import get_html
from cian_parser.models import UrlsAds, InformationFromAds
# from cian_parser.webdriver.opera_driver import Operadriver, path
from cian_parser.webdriver.chrome_driver import Chromedriver

def price_func(driver):
    price = driver.find_element_by_class_name('a10a3f92e9--price_value--1iPpd').text[:-2]
    return price


def about_house_func(driver):
    """
    'О доме' - on page ads in cian
    :param driver:
    :return: {'Тип жилья': 'Вторичка', 'Всего комнат в квартире': '8',
    'Комнат в продажу': '1', 'Площадь комнаты': '11 м²',
     'Санузел': '1 совмещенный', 'Ремонт': 'Косметический'}
    """
    name = driver.find_elements_by_class_name('a10a3f92e9--name--22FM0')
    value = driver.find_elements_by_class_name('a10a3f92e9--value--38caj')
    dict_info = {k.text: v.text for k, v in zip(name, value)}
    return dict_info


def general_information(driver):
    """
    'Общая информация' - on page ads in cian
    :param driver:
    :return:

    """
    name = driver.find_elements_by_class_name('a10a3f92e9--name--3bt8k')
    value = driver.find_elements_by_class_name('a10a3f92e9--value--3Ftu5')
    dict_info = {k.text: v.text for k, v in zip(name, value)}
    return dict_info


def description_info_func(driver):
    """
    info about flat under photo
    :param driver:
    :return: {'Комната': '11\xa0м²', 'Этаж': '5 из 5'}
    """
    name = driver.find_elements_by_class_name('a10a3f92e9--info-title--2bXM9')
    value = driver.find_elements_by_class_name('a10a3f92e9--info-value--18c8R')
    dict_info = {k.text: v.text for k, v in zip(name, value)}
    return dict_info


def description_func(driver):
    description = driver.find_element_by_class_name('a10a3f92e9--description-text--3Sal4').text
    return description


def offer_tittle_func(driver):
    offer_tittle = driver.find_element_by_class_name('a10a3f92e9--title--2Widg').text
    return offer_tittle


def geo(driver):
    name = ['region', 'locality-name', 'address', 'house']
    value = driver.find_elements_by_class_name('a10a3f92e9--address-item--1clHr')
    dict_info = {k: v.text for k, v in zip(name, value)}
    return dict_info


def main():
    urls = UrlsAds.objects.filter(status=0)
    # driver_obj = Operadriver()
    # driver_start = driver_obj.start_driver()
    # driver = driver_obj.opera(driver_start, path[0])
    driver_chrome_ibj = Chromedriver()
    driver = driver_chrome_ibj.start_driver()
    for url_ in urls:
        url = url_.url
        phone = url_.phone
        driver.get(url)
        sleep(random.randint(1, 3))
        # driver = get_html(url)
        try:
            InformationFromAds.objects.create(
                phone=phone,
                price=price_func(driver),
                url=url_,
                house_info=json.dumps(about_house_func(driver)),
                general_information=json.dumps(general_information(driver)),
                description_info=json.dumps(description_info_func(driver)),
                description=description_func(driver),
                offer_tittle=offer_tittle_func(driver),
                geo=json.dumps(geo(driver))
            )
            url_.status = 10
            url_.save()
            print(f'{url_}, added')
        except Exception as e:
            print(e)
            print(f"Can't save {url_}")
        # ad = {"creation_date": creation_date(driver),
        #       "phone": phone,
        #       "price": price(driver),
        #       "url": url,
        #       "house_info": about_house(driver),
        #       "general_information": general_information(driver),
        #       "description_info": description_info(driver),
        #       "description": description(driver),
        #       "offer_tittle": offer_tittle(driver),
        #       "geo": geo(driver)}
        # print(ad)


if __name__ == '__main__':
    main()

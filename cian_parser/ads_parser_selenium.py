import json
import random
from time import sleep
from cian_parser.models import UrlsAds, InformationFromAds
from cian_parser.webdriver.opera_driver import Operadriver, path
from cian_parser.utils import check_seller_phone_number

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


def geo_func(driver):
    name = ['region', 'locality-name', 'address', 'house']
    value = driver.find_elements_by_class_name('a10a3f92e9--address-item--1clHr')
    dict_info = {k: v.text for k, v in zip(name, value)}
    return dict_info


def seller_info_func(driver):
    description = driver.find_elements_by_class_name('a10a3f92e9--content--2Yraf')
    info = []
    for i in description:
        info.append(i.text)
    return info


def find_urls_photo(driver):
    try:
        photo_line = driver.find_element_by_class_name('fotorama__nav__shaft')
        urls_obj = photo_line.find_elements_by_class_name('fotorama__nav__frame')
        urls = []
        for url in urls_obj:
            urls.append(url.find_element_by_tag_name('img').get_attribute('src'))
        del urls[-1]
    except Exception:
        urls = []
    return urls


def main():
    urls = UrlsAds.objects.filter(status_info_parse=0).filter(region_id=1).order_by('-date')
    check_seller_phone_number(urls)
    driver_obj = Operadriver()
    driver_start = driver_obj.start_driver()
    driver = driver_obj.opera(driver_start, path[0])
    # driver_chrome_obj = Chromedriver()
    # driver = driver_chrome_ibj.start_driver()
    logs_counter = 0
    counter_error = 0
    for url_ in urls:
        url = url_.url
        phone = url_.phone
        region = url_.region
        driver.get(url)
        sleep(random.randint(1, 3))
        try:  # check ad removed from publication
            if driver.find_element_by_class_name('a10a3f92e9--container--1In69').text == 'Объявление снято с публикации':
                url_.status = 30
                print(f"{url}, ad removed from publication)")
                url_.save()
        except:
            try:
                InformationFromAds.objects.create(
                    phone=phone,
                    region=region,
                    price=price_func(driver),
                    inf_url_ads=url_,
                    house_info=json.dumps(about_house_func(driver)),
                    general_information=json.dumps(general_information(driver)),
                    description_info=json.dumps(description_info_func(driver)),
                    description=description_func(driver),
                    offer_tittle=offer_tittle_func(driver),
                    geo=json.dumps(geo_func(driver)),
                    seller_info=json.dumps(seller_info_func(driver)),
                    urls_on_photo=json.dumps(find_urls_photo(driver)),
                )
                url_.status = 10
                url_.save()
                print(f'{url}, added')
                logs_counter += 1
                print(logs_counter)
            except Exception as e:
                print(e)
                print(f"Can't save {url_}")
                url_.status += 2
                url_.save()
                counter_error += 1
                if counter_error > 10:  # restart driver, if cant parse 10 ads
                    driver.quit()
                    # driver = driver_chrome_obj.start_driver()
                    driver = driver_obj.opera(driver_start, path[0])
                    counter_error = 0
                    print('driver reboot')
            if logs_counter > 300:
                driver.quit()
                # driver = driver_chrome_obj.start_driver()
                driver = driver_obj.opera(driver_start, path[0])
                logs_counter = 0
                print('driver reboot')


if __name__ == '__main__':
    main()

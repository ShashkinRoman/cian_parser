import json
import random
from time import sleep
from avitoparser.models import InfoAboutAdsAvito, UrlsAdsAvito
from cian_parser.webdriver.opera_driver import Operadriver, path
from selenium.common.exceptions import NoSuchElementException


def price(driver):
    price_obj = driver.find_element_by_class_name('price-value-string')
    price_ = price_obj.find_element_by_tag_name('span').get_attribute('content')
    return price_


def info_over_title(driver):
    info_obj = driver.find_element_by_class_name('breadcrumbs')
    info_elements = info_obj.find_elements_by_class_name('js-breadcrumbs-link')
    city = info_elements[0].find_element_by_tag_name('span').text
    type_object = info_elements[2].find_element_by_tag_name('span').text
    type_ads = info_elements[3].find_element_by_tag_name('span').text
    type_flat = info_elements[4].find_element_by_tag_name('span').text
    type_house = info_elements[5].find_element_by_tag_name('span').text
    return city, type_object, type_ads, type_flat, type_house


def title_ads(driver):
    title = driver.find_element_by_class_name('title-info-title-text').text
    return title


def created_ads(driver):
    created = driver.find_element_by_class_name('title-info-metadata-item-redesign').text
    return created


def owner_ads(driver):
    name_lines = driver.find_element_by_class_name('seller-info-prop').find_elements_by_tag_name('div')
    return list(set([line.text for line in name_lines]))


def contact_name(driver):
    try:
        contact_name_lines = driver.find_element_by_class_name('seller-info-prop_short_margin').find_elements_by_tag_name('div')
        name_line = list(set([line.text for line in contact_name_lines]))
    except:
        name_line = ['None']
    return name_line


def param_list(driver):
    param_box = driver.find_element_by_class_name('item-params-list').find_elements_by_class_name('item-params-list-item')
    params_list = []
    [params_list.append(param.text) for param in param_box]
    return params_list


def address_info(driver):
    address_box = driver.find_element_by_class_name('item-address').text
    return address_box


def description_info(driver):
    try:
        description = driver.find_element_by_class_name('item-description-html').text
    except NoSuchElementException:
        description = ''
    return description


def phone_info(driver_mobile, url):
    driver_mobile.get(url)
    phone_button = driver_mobile.find_element_by_xpath(
        '//*[@id="app"]/div/div[2]/div[2]/div/div[2]/div/div/div[1]/div/div/div[1]').click()
    sleep(1)
    phone = driver_mobile.find_element_by_xpath('//*[@id="modal"]/div[2]/div/div[1]/span[2]').text[1:]
    return phone


def main():
    urls = UrlsAdsAvito.objects.filter(status=0).order_by('-date')
    driver_obj = Operadriver().start_driver()
    driver = Operadriver().opera(driver_obj, path[2])
    driver_mobile = Operadriver().opera(driver_obj, path[3])
    counter_for_reboot = 0
    for url_ in urls:
        url = url_.url
        region = url_.region
        driver.get(url)
        sleep(random.randint(1, 3))
        try:  # check ad removed from publication
            a = 1/0
            check_publication = driver.find_element_by_class_name(
                'a10a3f92e9--container--1In69').text == 'Объявление снято с публикации'
            url_.status = 30
            print(f"{url}, ad removed from publication)")
            url_.save()
        except:
            try:
                city, type_object, type_ads, type_flat, type_house = info_over_title(driver)
                InfoAboutAdsAvito.objects.create(
                    price=price(driver),
                    city=city,
                    type_object=type_object,
                    type_ads=type_ads,
                    type_flat=type_flat,
                    type_house=type_house,
                    title=title_ads(driver),
                    created=created_ads(driver),
                    owner_info=owner_ads(driver),
                    contact_name=contact_name(driver),
                    param_info=param_list(driver),
                    address=address_info(driver),
                    description=description_info(driver),
                    region=region,
                    phone=phone_info(driver_mobile, url),
                    url=url
                )
                counter_for_reboot += 1
                print(counter_for_reboot)
                if counter_for_reboot > 3:
                    driver.quit()
                    driver_mobile.quit()
                    driver = Operadriver().opera(driver_obj, path[2])
                    driver_mobile = Operadriver().opera(driver_obj, path[3])
                    counter_for_reboot = 0
            except Exception as e:
                print(f"{url}, exception: {e}")


if __name__ == '__main__':
    main()

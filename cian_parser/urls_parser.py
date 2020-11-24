import random
from datetime import datetime
from time import sleep
from cian_parser.utils import parameters_immovables, check_regions
from cian_parser.models import UrlsAds, Regions
from cian_parser.webdriver.opera_driver import Operadriver, path


def get_url_with_driver(driver, url_page, region_id, counter_repeat):
    driver.get(url_page)
    urls = driver.find_elements_by_class_name('_93444fe79c--container--2pFUD')  # ads container
    counter = 0
    counter_null = 0
    # scroll_counter = 1
    for u in urls:
        # scroll_counter += 1
        try:
            url = u.find_element_by_class_name('_93444fe79c--link--39cNw')\
                .get_attribute('href')  # url in title ad container
            try:
                UrlsAds.objects.get(url=url)
                counter += 1
            except UrlsAds.DoesNotExist:
                # ActionChains(driver).move_to_element(urls[scroll_counter].find_element_by_class_name('_93444fe79c--button--IypxH')).perform()
                button = u.find_element_by_class_name('_93444fe79c--button--IypxH')  # button with phone
                button.click()
                print('click')
                sleep(0.5)

                phone = u.find_element_by_class_name('_93444fe79c--phone-button--3RYRY')\
                    .find_element_by_tag_name('span').text  # container with button phone

                UrlsAds.objects.create(date=datetime.now(),
                                       url=url,
                                       region=Regions.objects.get(id=region_id),
                                       phone=phone)
                print(f"{phone}, {url} added")
                counter_null += 1
            except UrlsAds.MultipleObjectsReturned:
                print(f"{url} " )

        except Exception as exept:
            print(exept)
            print(f"for "
                  f"{u.find_element_by_class_name('_93444fe79c--link--39cNw').get_attribute('href')} urls not parsed")
    if counter > 25:
        counter_repeat += 1
    if counter_null == 0:
        counter_repeat += 1
    return counter_repeat


def main():
    reg = ["Балаково"]
    print('urls_parser start')
    region_city_code = check_regions(reg)
    urls_list = []
    driver_obj = Operadriver().start_driver()
    for region in region_city_code:
        urls = parameters_immovables(region)
        urls_list += urls
    for url in urls_list:
        driver = Operadriver().opera(driver_obj, path[2])
        print(url)
        counter_repeat = 0
        for i in range(1, 55):
            if counter_repeat > 10:
                break
            print(f'{counter_repeat} counter repeat')
            sleep(random.randint(3, 7))
            try:
                url_page = url[0] + str(i) + url[1]
                region_id = url[2]
                counter_repeat = get_url_with_driver(driver, url_page, region_id, counter_repeat)
                print(i)
            except:
                print(f"can't execute cycle {i}")
        driver.quit()
        print('urls_parser end')

if __name__ == '__main__':
    main()

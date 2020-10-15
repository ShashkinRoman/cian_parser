from datetime import datetime
from avitoparser.models import UrlsAdsAvito, RegionsAvito
from avitoparser.utils import UrlsBuilder, flats_request_avito
from cian_parser.webdriver.opera_driver import Operadriver, path
from selenium.common.exceptions import NoSuchElementException

def urls_generator_flats(regions):
    flats_types, house_types = flats_request_avito()
    urls_list = []
    # for house_type in house_types:
    for flats_type in flats_types:
        for region in regions:
                    region_ = RegionsAvito.objects.get(city=region).domen
                    url = UrlsBuilder('nedvij').urls(region_, flats_type, '', '')
                    urls_list.append(url)
    return urls_list


def find_last_page(driver):
    try:
        last_page = driver.find_elements_by_class_name('pagination-item-1WyVp')[-2].text
    except IndexError:
        last_page = 1
    except Exception as e:
        last_page = 1
        print('Unexpected error', e)
    return last_page


def get_urls(driver, url, region_for_bd, counter_repeat, counter_reboot):
    driver.get(url)
    urls = driver.find_elements_by_class_name('item_table-description')
    if len(urls) == 0:
        print('check urls_avito_parser/def get_urls/urls')
    counter = 0
    for url in urls:
        try:
            url_ = url.find_element_by_class_name('snippet-link').get_attribute('href')
            try:
                UrlsAdsAvito.objects.get(url=url_)
                counter += 1
            except UrlsAdsAvito.DoesNotExist:
                UrlsAdsAvito.objects.create(
                    date=datetime.now(),
                    url=url_,
                    region=region_for_bd
                )
                print(f"{url_} added")
        except NoSuchElementException:
            print('check urls_avito_parser/def get_urls/url_')
        except:
            print(f"for {url} urls not parsed")
        if counter >= 45:
            counter_repeat += 1
            print(f"{counter_repeat}")
    counter_reboot += 1
    print(f"counter_reboot {counter_reboot}")


def main():
    regions = ['Балаково']
    driver_obj = Operadriver().start_driver()
    driver = Operadriver().opera(driver_obj, path[2])
    counter_reboot = 0
    for region in regions:
        urls = urls_generator_flats(regions)
        region_for_bd = RegionsAvito.objects.get(city=region)
        for url in urls:
            url_ = url[0] + '1' + url[1]
            driver.get(url_)
            counter_repeat = 0
            last_page = find_last_page(driver)
            get_urls(driver, url_, region_for_bd, counter_repeat, counter_reboot)
            if last_page != '1':
                for page_number in range(2, int(last_page)):
                    next_url = url[0] + str(page_number) + url[1]
                    get_urls(driver, next_url, region_for_bd, counter_repeat, counter_reboot)
                    if counter_repeat >= 5:
                        print(f'unique ads ended on {page_number}, page {region}'
                              f'for urls {url}')
            if counter_reboot > 3:
                driver.quit()
                driver = Operadriver().opera(driver_obj, path[2])
                counter_reboot = 0
                print('driver reboot')


if __name__ == '__main__':
    main()
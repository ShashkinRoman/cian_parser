import random
import requests
from requests.exceptions import ProxyError, ChunkedEncodingError, ConnectionError
from datetime import datetime
from time import sleep
from bs4 import BeautifulSoup
from cian_parser.utils import header_proxy, proxy_parse, parameters_immovables, check_regions
from cian_parser.models import UrlsAds, Regions
from cian_parser.webdriver.opera_driver import Operadriver, path
from cian_parser.webdriver.chrome_driver import Chromedriver


def get_urls_from_page(url, urls_list, counter_ads, region_id, proxy_list):
    try:
        header, proxies = header_proxy(proxy_list)
        html = requests.get(url, headers=header,
                            proxies=proxies).text
        soup = BeautifulSoup(html, 'html.parser')
        if soup.find('title').text == 'Captcha - база объявлений ЦИАН':
            print(proxies, "changed")
            get_urls_from_page(url, urls_list, counter_ads, region_id, proxy_list)
        pages = soup.find_all(attrs={"class": "c6e8ba5398--header--1fV2A"})
        counter = 0
        for page in pages:
            link = page.attrs['href']
            try:
                UrlsAds.objects.get(url=link)
                counter += 1
            # except :
            #     counter += 1
            except UrlsAds.DoesNotExist:
                UrlsAds.objects.create(date=datetime.now(),
                                       url=link,
                                       region=Regions.objects.get(id=region_id))
                counter_ads += 1
            if counter >= 20:
                break
    except ProxyError or ChunkedEncodingError or ConnectionError:
        get_urls_from_page(url, urls_list, counter_ads, region_id, proxy_list)
        print('change proxy')
        # counter_proxy +=1
        # if counter_proxy == len(proxy_list):
        #     print("all proxy used and don't work")


def get_url_with_driver(driver, url_page, region_id, counter_repeat):
    driver.get(url_page)
    urls = driver.find_elements_by_class_name('c6e8ba5398--offer-container--2sOFx')
    for u in urls:
        try:
            url_obj = u.find_element_by_class_name('c6e8ba5398--header--1fV2A')
            url = url_obj.get_attribute('href')
            try:
                UrlsAds.objects.get(url=url)
                counter_repeat += 1
                # if counter_repeat > 20:
                #     break
                # print(f"repeat {counter_repeat}")
            except UrlsAds.DoesNotExist:
                button = u.find_element_by_class_name('c6e8ba5398--phone--1202f')
                button.click()
                sleep(0.5)
                phone = u.find_element_by_class_name('c6e8ba5398--text--38oi6').text
                UrlsAds.objects.create(date=datetime.now(),
                                       url=url,
                                       region=Regions.objects.get(id=region_id),
                                       phone=phone)
                print(f"{phone}, {url} added")
        except:
            print(f"for {u} urls not parsed")
    return counter_repeat

def main():
    reg = ["Балаково"]
    region_city_code = check_regions(reg)
    # proxy_list = proxy_parse()
    urls_list = []
    # driver_obj = Operadriver()
    # driver_start = driver_obj.start_driver()
    chrome_driver = Chromedriver()
    for region in region_city_code:
        urls = parameters_immovables(region)
        urls_list += urls
    urls_ads_list = []
    for url in urls_list:
        # driver = driver_obj.opera(driver_start, path[0])
        driver = chrome_driver.start_driver()
        print(url)
        counter_repeat = 0
        for i in range(1, 55):
            if counter_repeat > 50:
                break
            print(f'{counter_repeat} counter repeat')
            sleep(random.randint(3, 7))
            try:
                url_page = url[0] + str(i) + url[1]
                region_id = url[2]
                # start = len(urls_ads_list)
                # if counter > 50:
                #     print(f"counter > {counter}")
                #     break
                # elif test_request.status_code == 200:
                # print(start)
                # sleep(random.randint(1, 2))
                # get_urls_from_page(url_page, urls_ads_list, counter_repeat, region_id, proxy_list)
                counter_repeat = get_url_with_driver(driver, url_page, region_id, counter_repeat)
                # end = len(urls_ads_list)
                # if start == end:
                #     print(f'page for {url} ended {datetime.now()}')
                #     break
                print(i)
                # else:
                #     print(f"can't execute get_urls_from_page {i}, "
                #           f"status code request {test_request.status_code}")
            except:
                print(f"can't execute cycle {i}")
        driver.quit()



if __name__ == '__main__':
    main()
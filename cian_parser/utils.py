import requests
from bs4 import BeautifulSoup
from fake_useragent import UserAgent
from cian_parser.models import UrlsAds, Regions


def proxy_parse():
    url_proxy = 'http://foxtools.ru/proxy'
    html = requests.get(url_proxy).text
    soup = BeautifulSoup(html, 'html.parser')
    ip_list = soup.find_all("input", class_="ch")
    for i in range(0, len(ip_list)):
        ip_list[i] = ip_list[i]['value']
    return ip_list


def reserved_proxy():
    url = 'https://spys.one/en/http-proxy-list/'
    html = requests.get(url).text
    soup = BeautifulSoup(html, "html.parser")
    ip_list = soup.find_all("input", class_='spy1xx')


def header_proxy(proxy_list):
    proxy = proxy_list.pop(0)
    proxy_list.append(proxy)
    # proxy = FreeProxy().get()
    ua = UserAgent()
    header = {'User-Agent': str(ua.chrome)}
    proxies = {"http": "http://{}".format(proxy),
               # "https": "http://{}".format(proxy)
               }
    return header, proxies


def parameters_immovables_first_page(domen, region, city):
    ads = []

    for i in range(1, 6):
        url = 'https://' + domen + '.cian.ru/kupit-' + str(i) + '-komnatnuyu-kvartiru-' + region + '-' + city + '/'
        ads.append(url)

    mnogkomnatnuyu_kvartiru = 'https://' + domen + '.cian.ru/kupit-' + 'mnogkomnatnuyu-kvartiru' + '-' + region + '-' + city + '/'
    ads.append(mnogkomnatnuyu_kvartiru)
    studio = 'https://' + domen + '.cian.ru/kupit-kvartiru-' + 'studiu' + '-' + region + '-' + city + '/'
    ads.append(studio)
    room = 'https://' + domen + '.cian.ru/kupit-' + 'komnatu' + '-' + region + '-' + city + '/'
    ads.append(room)
    # todo add free_layout
    # free_layout = 'https://' + region + '.cian.ru/kupit-' + '-svobodnoy-planirovki/' + '-komnatnuyu-kvartiru-saratovskaya-oblast-' + city +'/'
    return ads


def parameters_immovables(dict_with_region):
    ads = []
    domen, location, region, region_id = dict_with_region.get('domen'), dict_with_region.get('code_location'),\
                                         dict_with_region.get('code'), dict_with_region.get('id')
    for i in range(0, 7):
        url1 = 'https://' + domen + '.cian.ru/cat.php?deal_type=sale&engine_version=2&location%5B0%5D=' \
               + location + '&offer_type=flat&p='
        url2 = '&region=' + region + '&room' + str(i) + '=1'
        url = (url1, url2, region_id)
        ads.append(url)
    return ads


def check_regions(regions):
    list_with_dicts = []
    for region in regions:
        region_obj = Regions.objects.get(region=region)
        dict_regions = {"id": region_obj.id,
                        "region": region_obj.region,
                        "city": region_obj.city,
                        "domen": region_obj.domen,
                        "code": region_obj.code,
                        "code_location": region_obj.code_location}
        list_with_dicts.append(dict_regions)
    return list_with_dicts


def get_html(url):
    proxy_list = proxy_parse()
    header, proxies = header_proxy(proxy_list)
    html = requests.get(url, headers=header, proxies=proxies).text
    soup = BeautifulSoup(html, 'html.parser')
    return soup

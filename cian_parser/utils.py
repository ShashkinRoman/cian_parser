import requests
from bs4 import BeautifulSoup
from cian_parser.models import UrlsAds, Regions, SerializerInfo
import json


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


def serializer_info(queryset_ads):
    for ad in queryset_ads:

        pass  # todo write serializer


def find_all_value(queryset_ads):
    """find all keys in info for serialaizer"""
    list_generar_info = []
    list_geo = []
    list_house_info = []
    list_description_info = []
    for ad in queryset_ads:
        for i in list(json.loads(ad.general_information).keys()):
            if i not in list_generar_info:
                list_generar_info.append(i)
        for i in list(json.loads(ad.geo).keys()):
            if i not in list_geo:
                list_geo.append(i)
        for i in list(json.loads(ad.house_info).keys()):
            if i not in list_house_info:
                list_house_info.append(i)
        for i in list(json.loads(ad.description_info).keys()):
            if i not in list_description_info:
                list_description_info.append(i)
    return list_generar_info, list_geo, list_house_info, \
           list_description_info


def lists_values():
    list_general_info = ['Тип жилья', 'Комнат в продажу', 'Площадь комнаты', 'Высота потолков',
                         'Санузел', 'Балкон/лоджия', 'Ремонт', 'Планировка', 'Вид из окон',
                         'Площадь комнат', 'Отделка', 'Всего комнат в квартире']
    list_geo = ['region', 'locality-name', 'address', 'house']
    list_house_info = ['Тип дома', 'Год постройки', 'Тип перекрытий', 'Подъезды', 'Лифты', 'Отопление',
                'Аварийность', 'Газоснабжение', 'Парковка', 'Строительная серия', 'Мусоропровод']
    list_description_info = ['Комната', 'Этаж', 'Общая', 'Кухня', 'Построен', 'Жилая', 'Срок сдачи']
    all_value = list_general_info + list_geo + list_house_info + list_description_info
    return list_general_info, list_geo, list_house_info, list_description_info, all_value


def serializer_ads(queryset_ads):
    _, _, _, _, list_with_info = lists_values()
    dict_with_info = {}
    for i in list_with_info:
        dict_with_info[i] = 'None'
    for ad in queryset_ads:
        dict_with_info.update({**json.loads(ad.description_info),
                               **json.loads(ad.general_information),
                               **json.loads(ad.house_info),
                               **json.loads(ad.geo)})
        try:
            dict_with_info['Комнат в продажу']
            category_ = 'комната'
        except KeyError:
            category_ = 'квартира'
        price_ = str.replace(' ', '')
        SerializerInfo.objects.create(
            type=dict_with_info['Тип сделки'] or 'Продажа',
            property_type=dict_with_info['Тип недвижимости'] or 'жилая',
            type_of_housing =dict_with_info['Тип жилья'],
            category=category_,
            url=ad.url,
            #creation_date=ad. # todo add func pars creation date
            region=dict_with_info['region'],
            district=dict_with_info['locality-name'],
            disrtict_area=dict_with_info['address'],
            address=dict_with_info['house'],
            price=price_,
            sales_agent=ad.sales_agent,
            rooms_offered=dict_with_info['Комнат в продажу'],
            room_space=dict_with_info['Площадь комнаты'],
            rooms_space=dict_with_info['Площадь комнат'],
            ceiling_height=dict_with_info['Высота потолков'],
            bathroom_unit=dict_with_info['Санузел'],
            balcony=dict_with_info['Балкон/лоджия'],
            renovation=dict_with_info['Ремонт'],
            flat_plan=dict_with_info['Планировка'],
            window_view=dict_with_info['Вид из окон'],
            finishing=dict_with_info['Отделка'],
            rooms=dict_with_info['Всего комнат в квартире'],
            building_type=dict_with_info['Тип дома'],
            built_year=dict_with_info['Год постройки'],
            floor_type=dict_with_info['Тип перекрытий'],
            porch=dict_with_info['Подъезды'],
            lift=dict_with_info['Лифты'],
            heating_supply=dict_with_info['Отопление'],
            accident_rate=dict_with_info['Аварийность'],
            gas_supply=dict_with_info['Газоснабжение'],
            parking=dict_with_info['Парковка'],
            series_construct=dict_with_info['Строительная серия'],
            rubbish_chute=dict_with_info['Мусоропровод'],
            room=dict_with_info['Комната'],
            floor=dict_with_info['Этаж'],
            area=dict_with_info['Общая'],
            kitchen_space=dict_with_info['Кухня'],
            living_space=dict_with_info['Жилая'],
            deadline=dict_with_info['Срок сдачи']
        )

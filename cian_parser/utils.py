from cian_parser.models import Regions, SerializerInfo, CianSerializeStatuses, UrlsAds, SellerAndOwner
from django.core.exceptions import ObjectDoesNotExist
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
    other = ['Тип сделки', 'Тип недвижимости']
    all_value = list_general_info + list_geo + list_house_info + list_description_info + other
    return list_general_info, list_geo, list_house_info, list_description_info, all_value


def serializer_ads(queryset_ads):
    _, _, _, _, list_with_info = lists_values()
    for ad in queryset_ads:
        dict_with_info = {}
        for i in list_with_info:
            dict_with_info[i] = None
        dict_with_info.update({**json.loads(ad.description_info),
                               **json.loads(ad.general_information),
                               **json.loads(ad.house_info),
                               **json.loads(ad.geo)})

        category_ = 'комната' if dict_with_info['Комнат в продажу'] != 'None' else 'квартира'
        balcony_ = True if dict_with_info['Балкон/лоджия'] != 'None' else False
        room_space_ = float(dict_with_info['Площадь комнаты'][:-3].replace(',', '.')) \
            if dict_with_info['Площадь комнаты'] != None else None
        dict_with_info['Тип сделки'] = 'Продажа'
        price_ = ad.price.replace(' ', '')

        SerializerInfo.objects.create(
            type_sale=dict_with_info['Тип сделки'],
            property_type=dict_with_info['Тип недвижимости'],
            type_of_housing=dict_with_info['Тип жилья'],
            category_obj=category_,
            ser_url_ads=UrlsAds.objects.get(url=ad.inf_url_ads.url),
            #creation_date=ad. # todo add func pars creation date
            region=dict_with_info['region'],
            district=dict_with_info['locality-name'],
            district_area=dict_with_info['address'],
            address=dict_with_info['house'],
            price=price_,
            sales_agent=json.loads(ad.seller_info)[0].split('\n') if json.loads(ad.seller_info) != [] else None,
            rooms_offered=dict_with_info['Комнат в продажу'],
            room_space=room_space_,
            ceiling_height=float(dict_with_info['Высота потолков'][:-2].replace(',', '.')) if dict_with_info['Высота потолков'] != None else None,
            bathroom_unit=dict_with_info['Санузел'],
            balcony=balcony_,
            renovation=dict_with_info['Ремонт'],
            flat_plan=dict_with_info['Планировка'],
            window_view=dict_with_info['Вид из окон'],
            finishing=dict_with_info['Отделка'],
            rooms=dict_with_info['Всего комнат в квартире'],
            building_type=dict_with_info['Тип дома'],
            built_year=int(dict_with_info['Год постройки']) if dict_with_info['Год постройки'] != None else None,
            floor_type=dict_with_info['Тип перекрытий'],
            porch=int(dict_with_info['Подъезды']) if dict_with_info['Подъезды'] != None else None,
            lift=dict_with_info['Лифты'],
            heating_supply=dict_with_info['Отопление'],
            accident_rate=dict_with_info['Аварийность'],
            gas_supply=dict_with_info['Газоснабжение'],
            parking=dict_with_info['Парковка'],
            series_construct=dict_with_info['Строительная серия'],
            rubbish_chute=dict_with_info['Мусоропровод'],
            floor=int(dict_with_info['Этаж'][0]) if dict_with_info['Этаж'] != None else None,
            floors_total=int(dict_with_info['Этаж'][-1]) if dict_with_info['Этаж'] != None else None,
            area=float(dict_with_info['Общая'][:-3].replace(',', '.')) if dict_with_info['Общая'] != None else None,
            kitchen_space=float(dict_with_info['Кухня'][:-3].replace(',', '.')) if dict_with_info['Кухня'] != None else None,
            living_space=float(dict_with_info['Жилая'][:-3].replace(',', '.')) if dict_with_info['Жилая'] != None else None,
            # deadline=dict_with_info['Срок сдачи'],
            description=ad.description
        )
        ad.serialize_status = CianSerializeStatuses.objects.get(status='Serialize successful')
        ad.save()


def check_seller_phone_number(queryset):
    """
    take instance UrlsParser, checks by the seller or owner by phone number
    If on one number more one ad, change status 'seller' or, add with this status.
    :param queryset:
    :return:
    """
    for ad in queryset:
        try:
            seller_obj = SellerAndOwner.objects.get(phone_number=ad.phone)
            if seller_obj.status == 1:
                seller_obj.status = 0
                seller_obj.save()
            if seller_obj.status == None:
                seller_obj.status = 1
                seller_obj.save()
        except ObjectDoesNotExist:
            SellerAndOwner.objects.create(phone_number=ad.phone, status=1)

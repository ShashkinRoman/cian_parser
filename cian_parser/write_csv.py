import csv
import json
from cian_parser.settings import BASE_DIR
from cian_parser.models import InformationFromAds


def take_info_for_csv():
    ads_obj = InformationFromAds.objects.filter(region_id=3)
    list_with_dicts = []
    for ad in ads_obj:
        try:
            ad_dict = {'id': ad.id,
                       'phone': ad.phone,
                       'price': ad.price,
                       'description': ad.description,
                       'url_id': ad.url_id,
                       'description_info': json.loads(ad.description_info),
                       'general_information': json.loads(ad.general_information),
                       'geo': json.loads(ad.geo),
                       'house_info': json.loads(ad.house_info),
                       'offer_title': ad.offer_tittle,
                       'region_id': ad.region_id,
                       'seller_info': json.loads(ad.seller_info)}
        except:
            ad_dict = {'id': ad.id,
                       'phone': ad.phone,
                       'price': ad.price,
                       'description': ad.description,
                       'url_id': ad.url_id,
                       'description_info': json.loads(ad.description_info),
                       'general_information': json.loads(ad.general_information),
                       'geo': json.loads(ad.geo),
                       'house_info': json.loads(ad.house_info),
                       'offer_title': ad.offer_tittle,
                       'region_id': ad.region_id,
                       'seller_info': ad.seller_info}
        list_with_dicts.append(ad_dict)
    return list_with_dicts





def write_csv_for_month_reports(dict_with_ads, filename):
    """
    write csv wit month indicators
    :return:
    """
    path = str(BASE_DIR) + '/' + str(filename) + '.csv'
    with open(path, 'a', newline="") as csv_file:
        writer = csv.writer(csv_file)
        writer.writerow(('id', 'phone', 'price', 'description',
                         'url_id', 'description_info', 'general_information',
                         'geo', 'house_info', 'offer_title', 'region_id', 'seller_info'))
        for ad in dict_with_ads:
            writer.writerow((ad['id'], ad['phone'], ad['price'],
                             ad['description'], ad['url_id'],
                             ad['description_info'], ad['general_information'],
                             ad['geo'], ad['house_info'],
                             ad['offer_title'], ad['region_id'], ad['seller_info']))


def main():
    filename = 'info_agensy'
    list_with_dicts = take_info_for_csv()
    write_csv_for_month_reports(list_with_dicts, filename)

if __name__ == '__main__':
    main()

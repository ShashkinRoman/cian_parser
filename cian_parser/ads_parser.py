import requests
import json
import random
from time import sleep
# from datetime import datetime
from bs4 import BeautifulSoup
from cian_parser.utils import get_html
from cian_parser.models import UrlsAds, InformationFromAds
# todo decorator with try except, for every function


def about_house(soup):
    info_about_house = soup.find_all(attrs={"class": "a10a3f92e9--value--38caj"})
    information = {}
    for i in info_about_house:
        information[i.previous] = i.text
    return information


def creation_date(soup):
    get_creation_date = soup.find(attrs={"data-name": "OfferAdded"}).text
    return get_creation_date


def general_information(soup):
    general = soup.find_all(attrs={"data-name": "AdditionalFeatureItem"})
    information = {}
    for i in general:
        information[i.contents[0].text] = i.contents[1].text
    return information


def description_info(soup):
    description_information = soup.find_all(attrs={"class": "a10a3f92e9--info--3XiXi"})
    information = {}
    for i in description_information:
        information[i.contents[1].text] = i.contents[0].text
    return information


def description(soup):
    description_ = soup.find(attrs={"itemprop": "description"}).text
    return description_


def offer_tittle(soup):
    title = soup.find(attrs={"data-name": "OfferTitle"}).text
    return title


def geo(soup):
    geo_info = soup.find(attrs={"data-name": "Geo"}).find_all(attrs={"data-name": "Link"})
    information = {"region": geo_info[0].text, "locality-name": geo_info[1].text,
                   "address": (geo_info[2].text, geo_info[3].text)}
    return information


def price(soup):
    price_ = soup.find(attrs={"itemprop": "price"}).text[:-2]
    return price_


def main():
    urls = UrlsAds.objects.filter(status=0)
    for url_ in urls:
        url = url_.url
        phone = url_.phone
        sleep(random.randint(1, 3))
        soup = get_html(url)
        try:
            InformationFromAds.objects.create(
                phone=phone,
                price=price(soup),
                url=url_,
                house_info=json.dumps(about_house(soup)),
                general_information=json.dumps(general_information(soup)),
                description_info=json.dumps(description_info(soup)),
                description=description(soup),
                offer_tittle=offer_tittle(soup),
                geo=json.dumps(geo(soup))
            )
            url_.status = 10
            url_.save()
            print(f'{url_}, added')
        except Exception as e:
            print(e)
            print(f"Can't save {url_}")
        # ad = {"creation_date": creation_date(soup),
        #       "phone": phone,
        #       "price": price(soup),
        #       "url": url,
        #       "house_info": about_house(soup),
        #       "general_information": general_information(soup),
        #       "description_info": description_info(soup),
        #       "description": description(soup),
        #       "offer_tittle": offer_tittle(soup),
        #       "geo": geo(soup)}
        # print(ad)


if __name__ == '__main__':
    main()

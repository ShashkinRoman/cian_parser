from cian_parser.utils import serializer_ads
from cian_parser.models import InformationFromAds


def main():
    ads_obj = InformationFromAds.objects.filter(serialize_status=1)
    serializer_ads(ads_obj)


if __name__ == '__main__':
    main()

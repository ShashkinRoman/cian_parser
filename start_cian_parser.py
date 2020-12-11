from cian_parser.urls_parser import main as cian_urls_parser
from cian_parser.ads_parser_selenium import main as cian_ads_parser
from cian_parser.serialize_ads import main as cian_serialize_ads
from cian_parser.cian_photo_parser import main as cian_photo_loaded

cian_urls_parser()
cian_ads_parser()
cian_serialize_ads()
cian_photo_loaded()

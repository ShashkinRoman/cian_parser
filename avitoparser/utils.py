
def flats_request_avito():
    return ['1к квартира', 'свободная планировка', 'квартира студия купить',
            '2к квартира', '3к квартира', '4к квартира',
            'купить 5 комнатную квартиру', 'купить 6 комнатную квартиру', 'купить 7к комнатную квартиру', 'купить 8к комнатную квартиру',
            'купить 9к комнатную квартиру'], ['vtorichka', 'novostroyka']


#
# def check_args():
#     parser = create_parser()
#     namespace = parser.parse_args(sys.argv[1:])
#     if namespace.region == ['beauty_large']:
#         regions = ["novosibirsk", "ekaterinburg", "nizhniy_novgorod", "kazan", "chelyabinsk", "omsk", "samara",
#                    "rostov-na-donu", "ufa", "krasnoyarsk", "voronezh", "perm", "volgograd", "krasnodar", "saratov",
#                    "tyumen", "tolyatti", "izhevsk", "barnaul", "ulyanovskaya_oblast", "irkutsk"]
#     if namespace.region == ['beauty_small']:
#         regions = ["habarovsk", "yaroslavl", "vladivostok", "mahachkala", "mahachkala", "orenburg", "kemerovo",
#                    "novokuznetsk", "ryazan", "astrahan", "naberezhnye_chelny", "penza", "kirovskaya_oblast_kirov",
#                    "lipetsk", "cheboksary", "balashiha", "kaliningrad", "tula", "kursk", "sevastopol", "sochi",
#                    "stavropol", "ulan-ude", "tver", "magnitogorsk", "ivanovo", "bryansk", "belgorod", "vladimir",
#                    "surgut", "nizhniy_tagil", "chita", "arhangelsk", "simferopol", "kaluga", "smolensk",
#                    "volgogradskaya_oblast_volzhskiy", "yakutsk", "saransk", "cherepovets", "kurgan", "vologda",
#                    "orel", "vladikavkaz", "podolsk", "groznyy", "murmansk", "tambov", "petrozavodsk", "sterlitamak",
#                    "nizhnevartovsk", "kostroma", "novorossiysk", "yoshkar-ola", "himki", "taganrog",
#                    "komsomolsk-na-amure", "syktyvkar", "nizhnekamsk", "nalchik", "shahty", "dzerzhinsk", "orsk",
#                    "bratsk", "amurskaya_oblast_blagoveschensk", "engels", "angarsk", "korolev", "velikiy_novgorod",
#                    "staryy_oskol", "mytischi", "pskov", "lyubertsy", "yuzhno-sahalinsk", "biysk", "prokopevsk",
#                    "armavir", "kaluga", "smolensk", "volgogradskaya_oblast_volzhskiy", "yakutsk", "saransk",
#                    "cherepovets", "kurgan", "vologda", "orel", "vladikavkaz", "podolsk", "groznyy", "murmansk",
#                    "tambov", "petrozavodsk", "sterlitamak", "nizhnevartovsk", "kostroma", "novorossiysk",
#                    "yoshkar-ola", "himki", "taganrog", "komsomolsk-na-amure", "syktyvkar", "nizhnekamsk", "nalchik",
#                    "shahty", "dzerzhinsk", "orsk", "bratsk", "amurskaya_oblast_blagoveschensk", "engels", "angarsk",
#                    "korolev", "velikiy_novgorod", "staryy_oskol", "mytischi", "pskov", "lyubertsy", "yuzhno-sahalinsk",
#                    "biysk", "prokopevsk", "armavir"]
#     if namespace.region == ['msk_mo']:
#         regions = ["moskva", "moskovskaya_oblast"]
#     else:
#         regions = namespace.region
#     requests = namespace.requests
#     database = namespace.database
#     type_ = namespace.type
#     threads = int(namespace.threads)
#     return regions, requests, database, type_, threads
#
#

class UrlsBuilder(object):
    """ В зависимости от object_parse выбирает вариант сборки урла
    возвращает шаблон урла каталога """
    def __init__(self, obj_pars):
        self.object_parse = obj_pars

    def urls(self, region, avito_request, house_type, flats_type):
        if self.object_parse == 'beauty':
            url = 'https://www.avito.ru/' + region\
                  + '/predlozheniya_uslug/krasota_zdorove-ASgBAgICAUSYC6qfAQ?q='\
                  + avito_request + '&p='

        if self.object_parse == 'nedvij':
            # url = 'https://www.avito.ru/' + region \
            #       + '/kvartiry/prodam/' + flats_type + '/' + house_type + '-ASgBAgICAUSSA8YQ' + '?cd=1&' \
            #       + avito_request + 'p='
            url = 'https://www.avito.ru/' + region + '/kvartiry/prodam-ASgBAgICAUSSA8YQ?p=', '&q=' + avito_request
        if self.object_parse == 'transport_perevozki':
            url = 'https://www.avito.ru/' + region \
                  + '/predlozheniya_uslug/transport_perevozki-ASgBAgICAUSYC8SfAQ' + '?p='
                  # + avito_request + \

        return url


def get_hash_avito(driver):
    driver.get('')
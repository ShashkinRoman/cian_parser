from functools import lru_cache
from datetime import datetime

from django.core.exceptions import MultipleObjectsReturned
from django.db import models, transaction
from random import randint

# transaction.atomic() na
day_key = datetime.today().day


class Region(models.Model):
    id = models.AutoField(verbose_name="id", primary_key=True)
    city = models.CharField(verbose_name="Запрос", max_length=255, default="Null")
    region = models.CharField(verbose_name="Город", max_length=255)
    domen = models.CharField(verbose_name="Поддомен", max_length=255, default="Null")
    code = models.CharField(verbose_name="Код в Cian", max_length=255)
    code_location = models.CharField(verbose_name="Параметр Location", max_length=255, default="Null")

    def __str__(self):
        return f"region: {self.region}. code: {self.code}"


class UrlsAds(models.Model):
    region = models.ForeignKey(Region, on_delete=models.CASCADE)
    request = models.CharField(verbose_name="Запрос", max_length=255, default="Null")
    date = models.DateTimeField(verbose_name="Дата парсинга информации")
    url = models.CharField(verbose_name="Ссылка", max_length=255, unique=True)
    status_info_parse = models.SmallIntegerField(default=0)
    phone = models.CharField(verbose_name='Телефон', max_length=255, default='None')
    # status_seller = models.SmallIntegerField(default=0) # 0 - not parse; 1 - parse successful

    class Meta:
        indexes = [
            models.Index(fields=['phone', 'date', 'url'])
        ]

    def __str__(self):
        return f"{self.phone}, {self.region}, {self.date}, {self.url}"


class ClientAdManager(models.Manager):
    def get_queryset(self):
        qs = super(ClientAdManager, self).get_queryset()
        return qs.exclude(ser_url_ads__phone__in=get_agents_phones(key=day_key))


class AgentAdManager(models.Manager):
    def get_queryset(self):
        qs = super(AgentAdManager, self).get_queryset()
        return qs.filter(ser_url_ads__phone__in=get_agents_phones(key=day_key))


class SerializerInfo(models.Model):
    #todo добавить прямую связь с Informationurlads
    @property
    def is_agent(self):
        return self.ser_url_ads.phone in get_agents_phones(key=day_key)

    @property
    def is_client(self):
        return not self.is_agent

    # information_from_ads_id = 123123
    # information_from_ads = models.ForeignKey()

    type_sale = models.CharField(verbose_name="Тип сделки", max_length=255, default='Продажа')  # «продажа» «аренда»
    property_type = models.CharField(verbose_name="Тип недвижимости", max_length=255, default='None', null=True) # «жилая»/«living».
    type_of_housing = models.CharField(verbose_name="Вторичка/новостройка", max_length=255, default='None', null=True)
    category_obj = models.CharField(verbose_name="Категория объекта", max_length=255, default='None', null=True) # . «квартира»/«flat» «комната»/«room», «таунхаус»/«townhouse»
    ser_url_ads = models.ForeignKey(UrlsAds, verbose_name="Ссылка", on_delete=models.CASCADE)

    @property
    def phone(self):
        return self.ser_url_ads.phone

    creation_date = models.DateTimeField(verbose_name="Дата размещения",  auto_now_add=True)  # YYYY-MM-DDTHH:mm:ss+00:00.
    country = models.CharField(verbose_name="Страна", max_length=255, default='Россия', null=True)
    region = models.CharField(verbose_name="Субъект", max_length=255, default='None', null=True)
    district = models.CharField(verbose_name="Населенный пункт", max_length=255, default='None', null=True)
    district_area = models.CharField(verbose_name="Район", max_length=255, default='None', null=True)
    address = models.CharField(verbose_name="Номер дома", max_length=255, null=True)
    price = models.FloatField(verbose_name="Информация о стоимомти", null=True)  # {value: '3000000', currency: 'RUB', period: 'месяц'}
    sales_agent = models.CharField(verbose_name="Информация об агенте", max_length=255, default='None', null=True)  #  {name: '', phone: '', category: '«агентство»/«agency», «застройщик»/«developer»', organization: 'имя организации', url: 'ссылка на профиль циан'}
    rooms_offered = models.IntegerField(verbose_name="Комнат в продажу", null=True)
    room_space = models.FloatField(verbose_name="Площадь комнаты", null=True)
    # rooms_space = models.FloatField(verbose_name="Площадь комнат", null=True)
    ceiling_height = models.FloatField(verbose_name="Высота потолков", null=True)
    bathroom_unit = models.CharField(verbose_name="Санузел", max_length=255, default='None', null=True)
    balcony = models.BooleanField(verbose_name="Балкон/лоджия", null=True)
    renovation = models.CharField(verbose_name="Ремонт", max_length=255, default='None', null=True)
    flat_plan = models.CharField(verbose_name="Планировка", max_length=255, default='None', null=True)
    window_view = models.CharField(verbose_name="Вид из окон", max_length=255, default='None', null=True)
    finishing = models.CharField(verbose_name="Отделка", max_length=255, default='None', null=True)
    rooms_charfield = models.CharField(verbose_name="Всего комнат в квартире", max_length=255, default='None', null=True)
    rooms = models.SmallIntegerField(verbose_name="Всего комнат в квартире", null=True)
    building_type = models.CharField(verbose_name="Тип дома", max_length=255, default='None', null=True)
    built_year = models.IntegerField(verbose_name="Год постройки", default='None', null=True)
    floor_type = models.CharField(verbose_name="Тип перекрытий", max_length=255, default='None', null=True)
    porch = models.IntegerField(verbose_name="Подъезды", default='None', null=True)
    lift = models.CharField(verbose_name="Лифты", max_length=255, default='None', null=True)
    heating_supply = models.CharField(verbose_name="Отопление", max_length=255, default='None', null=True)
    accident_rate = models.CharField(verbose_name="Аварийность", max_length=255, default='None', null=True)
    gas_supply = models.CharField(verbose_name="Газоснабжение", max_length=255, default='None', null=True)
    parking = models.CharField(verbose_name="Парковка", max_length=255, default='None', null=True)
    series_construct = models.CharField(verbose_name="Строительная серия", max_length=255, default='None', null=True)
    rubbish_chute = models.CharField(verbose_name="Мусоропровод", max_length=255, default='None', null=True)
    floor = models.IntegerField(verbose_name="Этаж", null=True)
    floors_total = models.IntegerField(verbose_name="Этажей в доме", null=True)
    area = models.FloatField(verbose_name="Общая", default='None', null=True)
    kitchen_space = models.FloatField(verbose_name="Кухня", default='None', null=True)
    living_space = models.FloatField(verbose_name="Жилая", default='None', null=True)
    # deadline = models.CharField(verbose_name="Срок сдачи", max_length=255, default='None', null=True)
    description = models.CharField(verbose_name="Описание", max_length=5000, default='None', null=True)
    urls = models.CharField(verbose_name="Дубль урлов из InformationFromAds", max_length=5000, null=True)
    # images_test = models.CharField(max_length=5000, null=True)
    # @property
    # def photos(self):
    #     return self.information_from_ads.photos
    objects = models.Manager()
    agents = AgentAdManager()
    clients = ClientAdManager()

    class Meta:
        ordering = ['-pk']
        # indexes = [
        #     models.Index(fields=['phone', 'date'])
        # ]

    def __str__(self):
        return f"{self.type_sale}, {self.property_type}, " \
               f"{self.ser_url_ads.url}, {self.creation_date}," \
               f"{self.price}, {self.sales_agent}"


@lru_cache(200)
def get_agents_phones(key):
    # print(key)
    ads_list = list(SerializerInfo.objects.select_related('ser_url_ads').all())
    phones_list = [o.ser_url_ads.phone for o in ads_list]

    agents = []
    verified = []
    for phone in phones_list:
        if phone in verified:
            agents.append(phone)
        verified.append(phone)
    return list(set(agents))


# @lru_cache(200)
# def get_clients_id(key):
#     # print(key)
#     all_obj = SerializerInfo.objects.select_related('ser_url_ads').all()
#     ads_list = list(all_obj)
#     phones_list = [o.ser_url_ads.phone for o in ads_list]
#     clients_id = []
#     clients_phones = []
#     for i in phones_list:
#         if phones_list.count(i) == 1:
#             clients_phones.append(i)
#     for i in clients_phones:
#             clients_id.append(all_obj.get(ser_url_ads__phone=i).id)
#     clients_id_sorted = sorted(clients_id, reverse=True)
#     return clients_id_sorted


class CianPhotoStatuses(models.Model):
    status = models.CharField(verbose_name='Статус скачивания фото', max_length=255)


class CianSerializeStatuses(models.Model):
    status = models.CharField(verbose_name='Статус сериализации объявления', max_length=255)


class InformationFromAds(models.Model):
    phone = models.CharField(verbose_name="Телефон", max_length=255, default='None')
    region = models.ForeignKey(Region, on_delete=models.CASCADE)
    price = models.CharField(verbose_name="Цена", max_length=255, default="None")
    inf_url_ads = models.OneToOneField("UrlsAds", related_name="url_ads", on_delete=models.CASCADE)
    house_info = models.CharField(verbose_name="Информация о доме", max_length=2500, default='None')
    general_information = models.CharField(verbose_name="Общая информация", max_length=2500, default='None')
    description_info = models.CharField(verbose_name="Инфо о кваритире из заголовка", max_length=2500, default='None')
    description = models.CharField(verbose_name="Описание", max_length=5000, default='None')
    offer_tittle = models.CharField(verbose_name="Заголовок объявления", max_length=1000, default='None')
    geo = models.CharField(verbose_name="Адрес", max_length=1000, default='None')
    seller_info = models.CharField(verbose_name="Информация о продавце", max_length=1000, default='None')
    serialize_status = models.ForeignKey(CianSerializeStatuses, on_delete=models.CASCADE, default=1)
    photo_parse_status = models.ForeignKey(CianPhotoStatuses, on_delete=models.CASCADE, default=1)
    urls_on_photo = models.CharField(verbose_name="Ссылки на фотографии", max_length=5000, default=None, null=True)
    rooms = models.SmallIntegerField(null=True)

    def __str__(self):
        return f"{self.phone}, {self.price}, {self.house_info}, " \
               f"{self.general_information}, {self.description_info}," \
               f"{self.description}, {self.offer_tittle}, {self.geo}"


def rand_file_name_path(object, filename):
    try:
        return f'{filename.split("_")[0]}/{randint(1,99)}/{randint(1,99)}/{"_".join(filename.split("_")[1:])}'
    except IndexError:
        return f'/{randint(1, 99)}/{randint(1, 99)}/{filename}'


class CianPhoto(models.Model):
    image = models.ImageField(upload_to=rand_file_name_path, null=True)
    url_ads = models.ForeignKey(InformationFromAds, verbose_name='Ссылка на объявление',
                                related_name='photos', on_delete=models.CASCADE, )
    ser_url_ads = models.ForeignKey(SerializerInfo, related_name='images', on_delete=models.CASCADE)


class SellerAndOwner(models.Model):
    phone_number = models.CharField(max_length=255, unique=True)
    status = models.SmallIntegerField(null=True)
    # 0 - seller; 1 - owner

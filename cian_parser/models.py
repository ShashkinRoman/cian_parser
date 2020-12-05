from django.db import models
from random import randint

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

    def __str__(self):
        return f"{self.phone}, {self.region}, {self.date}, {self.url}"


class SerializerInfo(models.Model):
    # information_from_ads_id = 123123
    # information_from_ads = models.ForeignKey()
    type_sale = models.CharField(verbose_name="Тип сделки", max_length=255, default='Продажа')  # «продажа» «аренда»
    property_type = models.CharField(verbose_name="Тип недвижимости", max_length=255, default='None', null=True) # «жилая»/«living».
    type_of_housing = models.CharField(verbose_name="Вторичка/новостройка", max_length=255, default='None', null=True)
    category_obj = models.CharField(verbose_name="Категория объекта", max_length=255, default='None', null=True) # . «квартира»/«flat» «комната»/«room», «таунхаус»/«townhouse»
    ser_url_ads = models.ForeignKey(UrlsAds, verbose_name="Ссылка", on_delete=models.CASCADE)
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
    rooms = models.CharField(verbose_name="Всего комнат в квартире", max_length=255, default='None', null=True)
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
    urls = models.CharField(verbose_name="Дубль урлов из InformationFromAds", max_length=1000, null=True)
    # @property
    # def photos(self):
    #     return self.information_from_ads.photos

    def __str__(self):
        return f"{self.type_sale}, {self.property_type}, " \
               f"{self.ser_url_ads.url}, {self.creation_date}," \
               f"{self.price}, {self.sales_agent}"


class CianPhotoStatuses(models.Model):
    status = models.CharField(verbose_name='Статус скачивания фото', max_length=255)


class CianSerializeStatuses(models.Model):
    status = models.CharField(verbose_name='Статус сериализации обхявления', max_length=255)


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

    def __str__(self):
        return f"{self.phone}, {self.price}, {self.house_info}, " \
               f"{self.general_information}, {self.description_info}," \
               f"{self.description}, {self.offer_tittle}, {self.geo}"


class CianPhoto(models.Model):
    image = models.ImageField(upload_to=f'balakovo/{randint(1,99)}/{randint(1,99)}', null=True)
    url_ads = models.ForeignKey(InformationFromAds, verbose_name='Ссылка на объявление',
                                related_name='photos', on_delete=models.CASCADE)
    ser_url_ads = models.ForeignKey(SerializerInfo, related_name='images', on_delete=models.CASCADE)


class SellerAndOwner(models.Model):
    phone_number = models.CharField(max_length=255, unique=True)
    status = models.SmallIntegerField(null=True)
    # 0 - seller; 1 - owner

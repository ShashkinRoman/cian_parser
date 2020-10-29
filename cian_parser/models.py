from django.db import models


class Regions(models.Model):
    id = models.AutoField(verbose_name="id", primary_key=True)
    city = models.CharField(verbose_name="Запрос", max_length=255, default="Null")
    region = models.CharField(verbose_name="Город", max_length=255)
    domen = models.CharField(verbose_name="Поддомен", max_length=255, default="Null")
    code = models.CharField(verbose_name="Код в Cian", max_length=255)
    code_location = models.CharField(verbose_name="Параметр Location", max_length=255, default="Null")

    def __str__(self):
        return f"region: {self.region}. code: {self.code}"


class UrlsAds(models.Model):
    region = models.ForeignKey("Regions", on_delete=models.CASCADE)
    request = models.CharField(verbose_name="Запрос", max_length=255, default="Null")
    date = models.DateTimeField(verbose_name="Дата парсинга информации")
    url = models.CharField(verbose_name="Ссылка", max_length=255)
    status = models.SmallIntegerField(default=0)
    phone = models.CharField(verbose_name='Телефон', max_length=255, default='None')

    def __str__(self):
        return f"{self.phone}, {Regions.region}, {self.date}, {self.url}"


class InformationFromAds(models.Model):
    phone = models.CharField(verbose_name="Телефон", max_length=255, default='None')
    region = models.ForeignKey("Regions", on_delete=models.CASCADE)
    price = models.CharField(verbose_name="Цена", max_length=255, default="None")
    url = models.OneToOneField("UrlsAds", related_name="url_ads", on_delete=models.CASCADE)
    house_info = models.CharField(verbose_name="Информация о доме", max_length=2500, default='None')
    general_information = models.CharField(verbose_name="Общая информация", max_length=2500, default='None')
    description_info = models.CharField(verbose_name="Инфо о кваритире из заголовка", max_length=2500, default='None')
    description = models.CharField(verbose_name="Описание", max_length=5000, default='None')
    offer_tittle = models.CharField(verbose_name="Заголовок объявления", max_length=1000, default='None')
    geo = models.CharField(verbose_name="Адрес", max_length=1000, default='None')
    seller_info = models.CharField(verbose_name="Информация о продавце", max_length=1000, default='None')
    serialize_status = models.SmallIntegerField(default=0)

    def __str__(self):
        return f"{self.phone}, {self.price}, {self.house_info}, " \
               f"{self.general_information}, {self.description_info}," \
               f"{self.description}, {self.offer_tittle}, {self.geo}" \
               f"{self.url}"


class SerializerInfo(models.Model):
    type_sale = models.CharField(verbose_name="Тип сделки", max_length=255, default='Продажа')# «продажа» «аренда»
    property_type = models.CharField(verbose_name="Тип недвижимости", max_length=255, default='None', null=True) # «жилая»/«living».
    type_of_housing = models.CharField(verbose_name="Вторичка/новостройка", max_length=255, default='None', null=True)
    category_obj = models.CharField(verbose_name="Категория объекта", max_length=255, default='None', null=True) # . «квартира»/«flat» «комната»/«room», «таунхаус»/«townhouse»
    url = models.ForeignKey(UrlsAds, verbose_name="Ссылка", on_delete=models.CASCADE)
    creation_date = models.DateTimeField(verbose_name="Дата размещения",  auto_now_add=True)  # YYYY-MM-DDTHH:mm:ss+00:00.
    # location = models.CharField(verbose_name="Местоположение", default='None')  # {country: 'страна', region: 'область', district: 'населенный пункт', address: 'улица и дом' apartment: 'номер квартиры'}
    country = models.CharField(verbose_name="Страна", max_length=255, default='Россия', null=True)
    region = models.CharField(verbose_name="Субъект", max_length=255, default='None', null=True)
    district = models.CharField(verbose_name="Населенный пункт", max_length=255, default='None', null=True)
    district_area = models.CharField(verbose_name="Район", max_length=255, default='None', null=True)
    address = models.IntegerField(verbose_name="Номер дома", null=True)
    price = models.FloatField(verbose_name="Информация о стоимомти", null=True)  # {value: '3000000', currency: 'RUB', period: 'месяц'}
    sales_agent = models.CharField(verbose_name="Информация об агенте", max_length=255, default='None', null=True)  #  {name: '', phone: '', category: '«агентство»/«agency», «застройщик»/«developer»', organization: 'имя организации', url: 'ссылка на профиль циан'}
    rooms_offered = models.IntegerField(verbose_name="Комнат в продажу", null=True)
    room_space = models.FloatField(verbose_name="Площадь комнаты", null=True)
    rooms_space = models.FloatField(verbose_name="Площадь комнат", null=True)
    ceiling_height = models.FloatField(verbose_name="Высота потолков", null=True)
    bathroom_unit = models.CharField(verbose_name="Санузел", max_length=255, default='None', null=True)
    balcony = models.BooleanField(verbose_name="Балкон/лоджия", null=True)
    renovation = models.CharField(verbose_name="Ремонт", max_length=255, default='None', null=True)
    flat_plan = models.CharField(verbose_name="Планировка", max_length=255, default='None', null=True)
    window_view = models.CharField(verbose_name="Вид из окон", max_length=255, default='None', null=True)
    finishing = models.CharField(verbose_name="Отделка", max_length=255, default='None', null=True)
    rooms = models.CharField(verbose_name="Всего комнат в квартире", max_length=255, default='None', null=True)
    building_type = models.CharField(verbose_name="Тип дома", max_length=255, default='None', null=True)
    built_year = models.CharField(verbose_name="Год постройки", max_length=255, default='None', null=True)
    floor_type = models.CharField(verbose_name="Тип перекрытий", max_length=255, default='None', null=True)
    porch = models.CharField(verbose_name="Подъезды", max_length=255, default='None', null=True)
    lift = models.CharField(verbose_name="Лифты", max_length=255, default='None', null=True)
    heating_supply = models.CharField(verbose_name="Отопление", max_length=255, default='None', null=True)
    accident_rate = models.CharField(verbose_name="Аварийность", max_length=255, default='None', null=True)
    gas_supply = models.CharField(verbose_name="Газоснабжение", max_length=255, default='None', null=True)
    parking = models.CharField(verbose_name="Парковка", max_length=255, default='None', null=True)
    series_construct = models.CharField(verbose_name="Строительная серия", max_length=255, default='None', null=True)
    rubbish_chute = models.CharField(verbose_name="Мусоропровод", max_length=255, default='None', null=True)
    floor = models.IntegerField(verbose_name="Этаж", null=True)
    floors_total = models.IntegerField(verbose_name="Этажей в доме", null=True)
    area = models.CharField(verbose_name="Общая", max_length=255, default='None', null=True)
    kitchen_space = models.CharField(verbose_name="Кухня", max_length=255, default='None', null=True)
    living_space = models.CharField(verbose_name="Жилая", max_length=255, default='None', null=True)
    deadline = models.CharField(verbose_name="Срок сдачи", max_length=255, default='None', null=True)
    description = models.CharField(verbose_name="Описание", max_length=5000, default='None', null=True)


    def __str__(self):
        return f"{self.type_sale}, {self.property_type}, " \
               f"{self.url}, {self.creation_date}," \
               f"{self.price}, {self.sales_agent}"

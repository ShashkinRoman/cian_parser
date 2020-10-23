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

    def __str__(self):
        return f"{self.phone}, {self.price}, {self.house_info}, " \
               f"{self.general_information}, {self.description_info}," \
               f"{self.description}, {self.offer_tittle}, {self.geo}" \
               f"{self.url}"


class SerializerInfo(models.Model):
    type = models.CharField(verbose_name="Тип сделки", max_length=255, default='Продажа')# «продажа» «аренда»
    property_type = models.CharField(verbose_name="Тип недвижимости", max_length=255, default='None') # «жилая»/«living».
    type_of_housing = models.CharField(verbose_name="Вторичка/новостройка", max_length=255, default='None')
    category = models.CharField(verbose_name="Категория объекта", max_length=255, default='None') # . «квартира»/«flat» «комната»/«room», «таунхаус»/«townhouse»
    url = models.CharField(verbose_name="Ссылка", max_length=255, default='None')
    creation_date = models.CharField(verbose_name="Дата размещения", default='None')  # YYYY-MM-DDTHH:mm:ss+00:00.
    # location = models.CharField(verbose_name="Местоположение", default='None')  # {country: 'страна', region: 'область', district: 'населенный пункт', address: 'улица и дом' apartment: 'номер квартиры'}
    country = models.CharField(verbose_name="Страна", default='None')
    region = models.CharField(verbose_name="Субъект", default='None')
    district = models.CharField(verbose_name="Населенный пункт", default='None')
    address = models.CharField(verbose_name="Номер дома", default='None')
    price = models.CharField(verbose_name="Информация о стоимомти", default='None')  # {value: '3000000', currency: 'RUB', period: 'месяц'}
    sales_agent = models.CharField(verbose_name="Информация об агенте", default='None')  #  {name: '', phone: '', category: '«агентство»/«agency», «застройщик»/«developer»', organization: 'имя организации', url: 'ссылка на профиль циан'}
    rooms_offered = models.CharField(verbose_name="Комнат в продажу", default='None')
    room_space = models.CharField(verbose_name="Площадь комнаты", default='None')
    rooms_space = models.CharField(verbose_name="Площадь комнат", default='None')
    ceiling_height = models.CharField(verbose_name="Высота потолков", default='None')
    bathroom_unit = models.CharField(verbose_name="Санузел", default='None')
    balcony = models.CharField(verbose_name="Балкон/лоджия", default='None')
    renovation = models.CharField(verbose_name="Ремонт", default='None')
    flat_plan = models.CharField(verbose_name="Планировка", default='None')
    window_view = models.CharField(verbose_name="Вид из окон", default='None')
    finishing = models.CharField(verbose_name="Отделка", default='None')
    rooms = models.CharField(verbose_name="Всего комнат в квартире", default='None')
    building_type = models.CharField(verbose_name="Год постройки", default='None')
    built_year = models.CharField(verbose_name="Год постройки", default='None')
    floor_type = models.CharField(verbose_name="Тип перекрытий", default='None')
    porch = models.CharField(verbose_name="Подъезды", default='None')
    lift = models.CharField(verbose_name="Лифты", default='None')
    heating_supply = models.CharField(verbose_name="Отопление", default='None')
    accident_rate = models.CharField(verbose_name="Аварийность", default='None')
    gas_supply = models.CharField(verbose_name="Газоснабжение", default='None')
    parking = models.CharField(verbose_name="Парковка", default='None')
    series_construct = models.CharField(verbose_name="Строительная серия", default='None')
    rubbish_chute = models.CharField(verbose_name="Мусоропровод", default='None')
    room = models.CharField(verbose_name="Комната", default='None')
    floor = models.CharField(verbose_name="Этаж", default='None')
    area = models.CharField(verbose_name="Общая", default='None')
    kitchen_space = models.CharField(verbose_name="Кухня", default='None')
    living_space = models.CharField(verbose_name="Жилая", default='None')
    deadline = models.CharField(verbose_name="Срок сдачи", default='None')

    def __str__(self):
        return f"{self.type}, {self.property_type}, {self.category}, " \
               f"{self.url}, {self.creation_date}," \
               f"{self.location}, {self.price}, {self.sales_agent}"

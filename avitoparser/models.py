from django.db import models
from datetime import datetime

class RegionsAvito(models.Model):
    city = models.CharField(verbose_name="Город", max_length=255, default="Null")
    domen = models.CharField(verbose_name="Город в URL", max_length=255, default="Null")
    region = models.CharField(verbose_name="Регион, область", max_length=255, default="Null")
    category = models.CharField(verbose_name="Категория парсинга", max_length=255, default="Null")


class InfoAboutAdsAvito(models.Model):
    price = models.IntegerField(verbose_name="Цена")
    date = models.DateTimeField(verbose_name="Дата парсинга информации", default=datetime.now())
    city = models.CharField(verbose_name="Город из заголовка", max_length=253)
    type_object = models.CharField(verbose_name="Тип объекта", max_length=254)
    type_ads = models.CharField(verbose_name="Тип сделки", max_length=261)
    type_flat = models.CharField(verbose_name="Количество комнат", max_length=260)
    type_house = models.CharField(verbose_name="Тип дома", max_length=259)
    title = models.CharField(verbose_name="Заголовок", max_length=1000)
    phone = models.CharField(verbose_name='Телефон', max_length=258)
    created = models.CharField(verbose_name="Дата создания", max_length=257)
    owner_info = models.CharField(verbose_name="Информация о владельце", max_length=1000)
    contact_name = models.CharField(verbose_name="Контактное лицо", max_length=256)
    param_info = models.CharField(verbose_name="Параметры квартиры", max_length=3000)
    # todo сделать gis поле
    address = models.CharField(verbose_name="Адрес", max_length=1000)
    description = models.CharField(verbose_name="Описание", max_length=5000)
    region = models.ForeignKey("RegionsAvito", on_delete=models.CASCADE)
    url = models.CharField(verbose_name="Ссылка", max_length=1000)
    # request = models.ForeignKey("UrlsAdsAvito", on_delete=models.CASCADE)
    # name = models.CharField(verbose_name="Имя", max_length=255)



class UrlsAdsAvito(models.Model):
    region = models.ForeignKey("RegionsAvito", on_delete=models.CASCADE)
    # request = models.CharField(verbose_name="Поисковый запрос", max_length=255)
    date = models.DateTimeField(verbose_name="Дата парсинга информации")
    url = models.CharField(verbose_name="Ссылка", max_length=1000)
    status = models.SmallIntegerField(default=0)

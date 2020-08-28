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

#
# class InformationFromAds(models.Model):
#     phone = models.CharField(verbose_name="Телефон", max_length=255)
#     request = models.OneToOneField("UrlsAds", verbose_name="Запрос",
#                                    related_name="request_ads", on_delete=models.CASCADE)
#     name = models.CharField(verbose_name="Имя", max_length=255)
#     title = models.CharField(verbose_name="Заголовок", max_length=255)
#     price = models.CharField(verbose_name="Цена", max_length=255)
#     place = models.CharField(verbose_name="Место", max_length=255)
#     description = models.CharField(verbose_name="Описание", max_length=255)
#     type_ads = models.CharField(verbose_name="Продавец", max_length=255)
#     region = models.ForeignKey("Regions", on_delete=models.CASCADE)
#     url = models.OneToOneField("UrlsAds", related_name="url_ads", on_delete=models.CASCADE)
#
    # def __str__(self):
    #     return f"{self.phone}, {self.request}, {self.title}, " \
    #            f"{self.price}, {self.description}, {self.type_ads}," \
    #            f"{self.region}, {self.url}"


class InformationFromAds(models.Model):
    phone = models.CharField(verbose_name="Телефон", max_length=255, default='None')
    price = models.CharField(verbose_name="Цена", max_length=255, default="None")
    url = models.OneToOneField("UrlsAds", related_name="url_ads", on_delete=models.CASCADE)
    house_info = models.CharField(verbose_name="Информация о доме", max_length=255, default='None')
    general_information = models.CharField(verbose_name="Общая информация", max_length=255, default='None')
    description_info = models.CharField(verbose_name="Инфо о кваритире из заголовка", max_length=255, default='None')
    description = models.CharField(verbose_name="Описание", max_length=255, default='None')
    offer_tittle = models.CharField(verbose_name="Заголовок объявления", max_length=255, default='None')
    geo = models.CharField(verbose_name="Адрес", max_length=255, default='None')

    def __str__(self):
        return f"{self.phone}, {self.price}, {self.house_info}, " \
               f"{self.general_information}, {self.description_info}," \
               f"{self.description}, {self.offer_tittle}, {self.geo}" \
               f"{self.url}"

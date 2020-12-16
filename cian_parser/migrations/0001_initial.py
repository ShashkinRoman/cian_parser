# Generated by Django 3.1 on 2020-10-27 14:38

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    initial = True

    dependencies = [
    ]

    operations = [
        migrations.CreateModel(
            name='Regions',
            fields=[
                ('id', models.AutoField(primary_key=True, serialize=False, verbose_name='id')),
                ('city', models.CharField(default='Null', max_length=255, verbose_name='Запрос')),
                ('region', models.CharField(max_length=255, verbose_name='Город')),
                ('domen', models.CharField(default='Null', max_length=255, verbose_name='Поддомен')),
                ('code', models.CharField(max_length=255, verbose_name='Код в Cian')),
                ('code_location', models.CharField(default='Null', max_length=255, verbose_name='Параметр Location')),
            ],
        ),
        migrations.CreateModel(
            name='SerializerInfo',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('type_sale', models.CharField(default='Продажа', max_length=255, verbose_name='Тип сделки')),
                ('property_type', models.CharField(default='None', max_length=255, verbose_name='Тип недвижимости')),
                ('type_of_housing', models.CharField(default='None', max_length=255, verbose_name='Вторичка/новостройка')),
                ('category_obj', models.CharField(default='None', max_length=255, verbose_name='Категория объекта')),
                ('url', models.CharField(default='None', max_length=1000, verbose_name='Ссылка')),
                ('creation_date', models.DateTimeField(auto_now_add=True, verbose_name='Дата размещения')),
                ('country', models.CharField(default='Россия', max_length=255, verbose_name='Страна')),
                ('region', models.CharField(default='None', max_length=255, verbose_name='Субъект')),
                ('district', models.CharField(default='None', max_length=255, verbose_name='Населенный пункт')),
                ('district_area', models.CharField(default='None', max_length=255, verbose_name='Район')),
                ('address', models.CharField(default='None', max_length=255, verbose_name='Номер дома')),
                ('price', models.CharField(default='None', max_length=255, verbose_name='Информация о стоимомти')),
                ('sales_agent', models.CharField(default='None', max_length=255, verbose_name='Информация об агенте')),
                ('rooms_offered', models.CharField(default='None', max_length=255, verbose_name='Комнат в продажу')),
                ('room_space', models.CharField(default='None', max_length=255, verbose_name='Площадь комнаты')),
                ('rooms_space', models.CharField(default='None', max_length=255, verbose_name='Площадь комнат')),
                ('ceiling_height', models.CharField(default='None', max_length=255, verbose_name='Высота потолков')),
                ('bathroom_unit', models.CharField(default='None', max_length=255, verbose_name='Санузел')),
                ('balcony', models.CharField(default='None', max_length=255, verbose_name='Балкон/лоджия')),
                ('renovation', models.CharField(default='None', max_length=255, verbose_name='Ремонт')),
                ('flat_plan', models.CharField(default='None', max_length=255, verbose_name='Планировка')),
                ('window_view', models.CharField(default='None', max_length=255, verbose_name='Вид из окон')),
                ('finishing', models.CharField(default='None', max_length=255, verbose_name='Отделка')),
                ('rooms', models.CharField(default='None', max_length=255, verbose_name='Всего комнат в квартире')),
                ('building_type', models.CharField(default='None', max_length=255, verbose_name='Тип дома')),
                ('built_year', models.CharField(default='None', max_length=255, verbose_name='Год постройки')),
                ('floor_type', models.CharField(default='None', max_length=255, verbose_name='Тип перекрытий')),
                ('porch', models.CharField(default='None', max_length=255, verbose_name='Подъезды')),
                ('lift', models.CharField(default='None', max_length=255, verbose_name='Лифты')),
                ('heating_supply', models.CharField(default='None', max_length=255, verbose_name='Отопление')),
                ('accident_rate', models.CharField(default='None', max_length=255, verbose_name='Аварийность')),
                ('gas_supply', models.CharField(default='None', max_length=255, verbose_name='Газоснабжение')),
                ('parking', models.CharField(default='None', max_length=255, verbose_name='Парковка')),
                ('series_construct', models.CharField(default='None', max_length=255, verbose_name='Строительная серия')),
                ('rubbish_chute', models.CharField(default='None', max_length=255, verbose_name='Мусоропровод')),
                ('room', models.CharField(default='None', max_length=255, verbose_name='Комната')),
                ('floor', models.CharField(default='None', max_length=255, verbose_name='Этаж')),
                ('area', models.CharField(default='None', max_length=255, verbose_name='Общая')),
                ('kitchen_space', models.CharField(default='None', max_length=255, verbose_name='Кухня')),
                ('living_space', models.CharField(default='None', max_length=255, verbose_name='Жилая')),
                ('deadline', models.CharField(default='None', max_length=255, verbose_name='Срок сдачи')),
                ('description', models.CharField(default='None', max_length=5000, verbose_name='Описание')),
            ],
        ),
        migrations.CreateModel(
            name='UrlsAds',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('request', models.CharField(default='Null', max_length=255, verbose_name='Запрос')),
                ('date', models.DateTimeField(verbose_name='Дата парсинга информации')),
                ('url', models.CharField(max_length=255, verbose_name='Ссылка')),
                ('status', models.SmallIntegerField(default=0)),
                ('phone', models.CharField(default='None', max_length=255, verbose_name='Телефон')),
                ('region', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='cian_parser.regions')),
            ],
        ),
        migrations.CreateModel(
            name='InformationFromAds',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('phone', models.CharField(default='None', max_length=255, verbose_name='Телефон')),
                ('price', models.CharField(default='None', max_length=255, verbose_name='Цена')),
                ('house_info', models.CharField(default='None', max_length=2500, verbose_name='Информация о доме')),
                ('general_information', models.CharField(default='None', max_length=2500, verbose_name='Общая информация')),
                ('description_info', models.CharField(default='None', max_length=2500, verbose_name='Инфо о кваритире из заголовка')),
                ('description', models.CharField(default='None', max_length=5000, verbose_name='Описание')),
                ('offer_tittle', models.CharField(default='None', max_length=1000, verbose_name='Заголовок объявления')),
                ('geo', models.CharField(default='None', max_length=1000, verbose_name='Адрес')),
                ('seller_info', models.CharField(default='None', max_length=1000, verbose_name='Информация о продавце')),
                ('serialize_status', models.SmallIntegerField(default=0)),
                ('region', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='cian_parser.regions')),
                ('url', models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name='url_ads', to='cian_parser.urlsads')),
            ],
        ),
    ]
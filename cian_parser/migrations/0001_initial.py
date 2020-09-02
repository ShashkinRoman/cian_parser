# Generated by Django 3.1 on 2020-08-25 07:54

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
                ('id', models.AutoField(db_column='id', primary_key=True, serialize=False)),
                ('region', models.CharField(max_length=255, verbose_name='Регион')),
                ('code', models.CharField(max_length=255, verbose_name='Код в Cian')),
                ('date', models.DateTimeField(verbose_name='Дата парсинга урла')),
            ],
        ),
        migrations.CreateModel(
            name='UrlsAds',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('request', models.CharField(max_length=255, verbose_name='Запрос')),
                ('date', models.DateTimeField(verbose_name='Дата парсинга информации')),
                ('url', models.CharField(max_length=255, verbose_name='Ссылка')),
                ('status', models.SmallIntegerField()),
                ('region', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='cian_parser.regions')),
            ],
        ),
        migrations.CreateModel(
            name='InformationFromAds',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('phone', models.CharField(max_length=255, verbose_name='Телефон')),
                ('name', models.CharField(max_length=255, verbose_name='Имя')),
                ('title', models.CharField(max_length=255, verbose_name='Заголовок')),
                ('price', models.CharField(max_length=255, verbose_name='Цена')),
                ('place', models.CharField(max_length=255, verbose_name='Место')),
                ('description', models.CharField(max_length=255, verbose_name='Описание')),
                ('type_ads', models.CharField(max_length=255, verbose_name='Продавец')),
                ('region', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='cian_parser.regions')),
                ('request', models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name='request_ads', to='cian_parser.urlsads', verbose_name='Запрос')),
                ('url', models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name='url_ads', to='cian_parser.urlsads')),
            ],
        ),
    ]
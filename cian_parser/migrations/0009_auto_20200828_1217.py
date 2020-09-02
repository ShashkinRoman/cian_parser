# Generated by Django 3.1 on 2020-08-28 12:17

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('cian_parser', '0008_urlsads_phone'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='informationfromads',
            name='name',
        ),
        migrations.RemoveField(
            model_name='informationfromads',
            name='place',
        ),
        migrations.RemoveField(
            model_name='informationfromads',
            name='region',
        ),
        migrations.RemoveField(
            model_name='informationfromads',
            name='request',
        ),
        migrations.RemoveField(
            model_name='informationfromads',
            name='title',
        ),
        migrations.RemoveField(
            model_name='informationfromads',
            name='type_ads',
        ),
        migrations.AddField(
            model_name='informationfromads',
            name='description_info',
            field=models.CharField(default='None', max_length=255, verbose_name='Инфо о кваритире из заголовка'),
        ),
        migrations.AddField(
            model_name='informationfromads',
            name='general_information',
            field=models.CharField(default='None', max_length=255, verbose_name='Общая информация'),
        ),
        migrations.AddField(
            model_name='informationfromads',
            name='geo',
            field=models.CharField(default='None', max_length=255, verbose_name='Адрес'),
        ),
        migrations.AddField(
            model_name='informationfromads',
            name='house_info',
            field=models.CharField(default='None', max_length=255, verbose_name='Информация о доме'),
        ),
        migrations.AddField(
            model_name='informationfromads',
            name='offer_tittle',
            field=models.CharField(default='None', max_length=255, verbose_name='Заголовок объявления'),
        ),
        migrations.AlterField(
            model_name='informationfromads',
            name='description',
            field=models.CharField(default='None', max_length=255, verbose_name='Описание'),
        ),
        migrations.AlterField(
            model_name='informationfromads',
            name='phone',
            field=models.CharField(default='None', max_length=255, verbose_name='Телефон'),
        ),
        migrations.AlterField(
            model_name='informationfromads',
            name='price',
            field=models.IntegerField(default=0, verbose_name='Цена'),
        ),
    ]
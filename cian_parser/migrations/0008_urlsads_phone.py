# Generated by Django 3.1 on 2020-08-28 09:38

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('cian_parser', '0007_auto_20200826_1308'),
    ]

    operations = [
        migrations.AddField(
            model_name='urlsads',
            name='phone',
            field=models.CharField(default='None', max_length=255, verbose_name='Телефон'),
        ),
    ]

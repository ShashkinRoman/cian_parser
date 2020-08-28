# Generated by Django 3.1 on 2020-08-26 07:04

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('cian_parser', '0003_regions_code_location'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='regions',
            name='transcription',
        ),
        migrations.AddField(
            model_name='regions',
            name='domen',
            field=models.CharField(default='Null', max_length=255, verbose_name='Поддомен'),
        ),
    ]

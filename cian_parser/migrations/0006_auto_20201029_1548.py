# Generated by Django 3.1 on 2020-10-29 12:48

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('cian_parser', '0005_remove_serializerinfo_room'),
    ]

    operations = [
        migrations.AlterField(
            model_name='serializerinfo',
            name='balcony',
            field=models.BooleanField(null=True, verbose_name='Балкон/лоджия'),
        ),
    ]
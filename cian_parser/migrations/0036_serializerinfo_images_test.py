# Generated by Django 3.1 on 2020-12-13 19:00

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('cian_parser', '0035_auto_20201213_2002'),
    ]

    operations = [
        migrations.AddField(
            model_name='serializerinfo',
            name='images_test',
            field=models.CharField(max_length=10000, null=True),
        ),
    ]

# Generated by Django 3.1 on 2020-11-03 10:31

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('cian_parser', '0016_auto_20201102_1642'),
    ]

    operations = [
        migrations.AlterField(
            model_name='cianphoto',
            name='image',
            field=models.FileField(null=True, upload_to=''),
        ),
    ]

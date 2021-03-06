# Generated by Django 3.1 on 2020-12-05 11:38

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('cian_parser', '0029_serializerinfo_urls'),
    ]

    operations = [
        migrations.AlterField(
            model_name='cianphoto',
            name='image',
            field=models.ImageField(null=True, upload_to='balakovo/72/71'),
        ),
        migrations.AlterField(
            model_name='cianphoto',
            name='ser_url_ads',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='images', to='cian_parser.serializerinfo'),
        ),
    ]

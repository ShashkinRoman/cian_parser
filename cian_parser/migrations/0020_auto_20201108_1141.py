# Generated by Django 3.1 on 2020-11-08 08:41

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('cian_parser', '0019_auto_20201108_1127'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='informationfromads',
            name='photo_parse_status',
        ),
        migrations.RemoveField(
            model_name='informationfromads',
            name='serialize_status',
        ),
    ]
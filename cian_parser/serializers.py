from django.contrib.auth.models import User, Group
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import serializers, filters
from cian_parser.models import InformationFromAds, UrlsAds, SerializerInfo, CianPhoto


class InformationFromAdsSerializer(serializers.ModelSerializer):
    class Meta:
        model = InformationFromAds
        exclude = ()


class SerializerInfoSerializer(serializers.ModelSerializer):
    class Meta:
        model = SerializerInfo
        exclude = ()
        depth = 1


class UrlsAdsSerializer(serializers.ModelSerializer):

    class Meta:
        model = UrlsAds
        fields = ['region', 'request', 'date', 'url', 'status', 'phone']


class CianPhotoSerializer(serializers.ModelSerializer):
    class Meta:
        model = CianPhoto
        exclude = ()

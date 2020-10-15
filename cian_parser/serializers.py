from django.contrib.auth.models import User, Group
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import serializers, filters
from cian_parser.models import InformationFromAds, UrlsAds


class InformationFromAdsSerializer(serializers.ModelSerializer):
    class Meta:
        model = InformationFromAds
        exclude = ()


class UrlsAdsSerializer(serializers.ModelSerializer):
    class Meta:
        model = UrlsAds
        fields = ['region', 'request', 'date', 'url', 'status', 'phone']
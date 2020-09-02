from django.contrib.auth.models import User, Group
from rest_framework import serializers
from cian_parser.models import InformationFromAds, UrlsAds


class UserSerializer(serializers.HyperlinkedModelSerializer):
    class Meta:
        model = InformationFromAds
        fields = ['phone', 'price', 'url', 'house_info', 'general_information',
                  'description_info', 'description', 'offer_tittle', 'geo']


class GroupSerializer(serializers.HyperlinkedModelSerializer):
    class Meta:
        model = UrlsAds
        fields = ['region', 'request', 'date', 'url', 'status', 'phone']
import json
from django.contrib.auth.models import User, Group
from django_filters.rest_framework import DjangoFilterBackend
import os
from rest_framework import serializers, filters
from cian_parser.models import InformationFromAds, UrlsAds, SerializerInfo, CianPhoto
from dotenv import load_dotenv
load_dotenv()

class InformationFromAdsSerializer(serializers.ModelSerializer):
    class Meta:
        model = InformationFromAds
        exclude = ()


# class CianPhotoSerializer(serializers.ModelSerializer):
#
#     class Meta:
#         model = CianPhoto
#         fields = ('image',)


class SerializerInfoSerializer(serializers.ModelSerializer):
    phone = serializers.ReadOnlyField()
    is_agent = serializers.ReadOnlyField()
    is_client = serializers.ReadOnlyField()
    images = serializers.SerializerMethodField()

    def get_images(self, obj):
        obj_cian_photo = obj.images.all()
        list_of_dict_images = []
        for image in obj_cian_photo:
            list_of_dict_images.append({'image': f'http://{os.getenv("IP")}{image.image.url}'})
        return list_of_dict_images
        # images_json_serialized = obj.ser_url_ads.url_ads.urls_on_photo
        # list_of_dict_images = []
        # try:
        #     images_json = json.loads(images_json_serialized)
        # except json.decoder.JSONDecodeError:
        #     return list_of_dict_images
        # for image in images_json:
        #     list_of_dict_images.append({'image': image.replace('-2.jpg', '-1.jpg')})
        # return list_of_dict_images

    class Meta:
        model = SerializerInfo
        exclude = ()
        depth = 1


class UrlsAdsSerializer(serializers.ModelSerializer):

    class Meta:
        model = UrlsAds
        fields = ['region', 'request', 'date', 'url', 'status', 'phone']


class NewOwnersSerializers(serializers.ModelSerializer):
    phone = serializers.ReadOnlyField()

    class Meta:
        model = SerializerInfo
        exclude = ()
        # depth = 1

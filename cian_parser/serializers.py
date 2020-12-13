import json

from django.contrib.auth.models import User, Group
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import serializers, filters
from cian_parser.models import InformationFromAds, UrlsAds, SerializerInfo, CianPhoto


class InformationFromAdsSerializer(serializers.ModelSerializer):
    class Meta:
        model = InformationFromAds
        exclude = ()


class CianPhotoSerializer(serializers.ModelSerializer):
    # images_list = serializers.SerializerMethodField()
    #
    # def get_images_list(self, obj):
    #     images_json_serialized = self.inf_url_ads.urls_on_photo
    #     images_json = json.loads(images_json_serialized)
    #     return images_json

    class Meta:
        model = CianPhoto
        fields = ('image',)


class SerializerInfoSerializer(serializers.ModelSerializer):
    phone = serializers.ReadOnlyField()
    is_agent = serializers.ReadOnlyField()
    is_client = serializers.ReadOnlyField()
    # photos = serializers.HyperlinkedRelatedField(
    #     many=True,
    #     read_only=True,
    #     view_name='cianphoto-detail'
    # )
    # photos = serializers.
    # photos = serializers.PrimaryKeyRelatedField(read_only=False,
    #                                             queryset=CianPhoto.objects.all(),
    #                                             )
    # images = CianPhotoSerializer(many=True)
    images = serializers.SerializerMethodField()

    def get_images(self, obj):
        images_json_serialized = obj.ser_url_ads.url_ads.urls_on_photo
        images_json = json.loads(images_json_serialized)
        list_of_dict_images = []
        for image in images_json:
            list_of_dict_images.append({'image': image.replace('-2.jpg', '-1.jpg')})
        return list_of_dict_images

    class Meta:
        model = SerializerInfo
        exclude = ()
        # fields = ['ser_photos']
        depth = 1


class UrlsAdsSerializer(serializers.ModelSerializer):

    class Meta:
        model = UrlsAds
        fields = ['region', 'request', 'date', 'url', 'status', 'phone']




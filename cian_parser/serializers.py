from django.contrib.auth.models import User, Group
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import serializers, filters
from cian_parser.models import InformationFromAds, UrlsAds, SerializerInfo, CianPhoto


class InformationFromAdsSerializer(serializers.ModelSerializer):
    class Meta:
        model = InformationFromAds
        exclude = ()


class CianPhotoSerializer(serializers.ModelSerializer):
    # jopa = serializers.SerializerMethodField()
    #
    # def get_jopa(self, obj):
    #     return 'jopa is here'

    class Meta:
        model = CianPhoto
        fields = ('image',)


class SerializerInfoSerializer(serializers.ModelSerializer):
    # photos = serializers.HyperlinkedRelatedField(
    #     many=True,
    #     read_only=True,
    #     view_name='cianphoto-detail'
    # )
    # photos = serializers.
    # photos = serializers.PrimaryKeyRelatedField(read_only=False,
    #                                             queryset=CianPhoto.objects.all(),
    #                                             )
    ser_photos = CianPhotoSerializer(many=True)

    class Meta:
        model = SerializerInfo
        exclude = ()
        # fields = ['ser_photos']
        depth = 1


class UrlsAdsSerializer(serializers.ModelSerializer):

    class Meta:
        model = UrlsAds
        fields = ['region', 'request', 'date', 'url', 'status', 'phone']




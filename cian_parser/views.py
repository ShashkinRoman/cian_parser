from django.contrib.auth.models import User, Group
from django.shortcuts import redirect, render
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import viewsets, filters
from rest_framework import permissions
from cian_parser.serializers import UrlsAdsSerializer, InformationFromAdsSerializer, SerializerInfoSerializer,\
    CianPhotoSerializer, NewOwnersSerializers
from cian_parser.models import InformationFromAds, UrlsAds, SerializerInfo, get_clients_id, day_key


class InformationFromAdsViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows users to be viewed or edited.
    """
    queryset = InformationFromAds.objects.all()
    serializer_class = InformationFromAdsSerializer
    # permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    search_fields = ('$phone', '$house_info', '$description', '$general_information', '$description_info')
    filterset_fields = ('phone',)


class SerializerInfoViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows users to be viewed or edited.
    """
    queryset = SerializerInfo.objects.filter(rooms__isnull=False)
    serializer_class = SerializerInfoSerializer
    # permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    # search_fields = ('$phone', '$house_info', '$description', '$general_information', '$description_info')
    # filterset_fields = ('phone',)


class NewOwnersViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows users to be viewed or edited.
    """
    queryset = SerializerInfo.objects.filter(pk__in=get_clients_id(day_key))
    serializer_class = NewOwnersSerializers
    # permission_classes = [permissions.IsAuthenticated]
    # filter_backends = [DjangoFilterBackend, filters.SearchFilter]


class UrlsAdsViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows groups to be viewed or edited.
    """
    queryset = UrlsAds.objects.select_related('ser_url_ads').all()
    serializer_class = UrlsAdsSerializer
    # permission_classes = [permissions.IsAuthenticated]


class CianPhotoViewSet(viewsets.ModelViewSet):

    queryset = UrlsAds.objects.all()
    serializer_class = CianPhotoSerializer

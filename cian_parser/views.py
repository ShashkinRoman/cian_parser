from django.contrib.auth.models import User, Group
from django.shortcuts import redirect, render
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import viewsets, filters
from rest_framework import permissions
from rest_framework.decorators import action
from rest_framework.response import Response

from cian_parser.serializers import UrlsAdsSerializer, InformationFromAdsSerializer, SerializerInfoSerializer, \
    NewOwnersSerializers
    # CianPhotoSerializer, \

from cian_parser.models import InformationFromAds, UrlsAds, SerializerInfo, day_key, get_agents_phones
    # CianPhoto


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
    queryset = SerializerInfo.objects.filter(rooms__isnull=False).filter(
        ser_url_ads__url_ads__urls_on_photo__startswith='["')
    serializer_class = SerializerInfoSerializer
    # permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    # search_fields = ('$phone', '$house_info', '$description', '$general_information', '$description_info')
    # filterset_fields = ('phone',)



class NewOwnersViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows users to be viewed or edited.
    """
    # pk_client_list = [client.pk for client in list(SerializerInfo.objects.all()) if client.is_client]
    agent_phones = get_agents_phones(day_key)
    queryset = SerializerInfo.objects.filter(sales_agent__isnull=True).exclude(ser_url_ads__phone__in=agent_phones)
    serializer_class = NewOwnersSerializers
    # permission_classes = [permissions.IsAuthenticated]
    # filter_backends = [DjangoFilterBackend, filters.SearchFilter]

    @action(detail=False)
    def jopa(self, request):
        objects = SerializerInfo.objects.all()

        # Првоеряем пагинацию
        objects = self.paginate_queryset(objects)
        if objects is not None:
            serializer = self.get_serializer(objects, many=True)
            return self.get_paginated_response(serializer.data)


class UrlsAdsViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows groups to be viewed or edited.
    """
    queryset = UrlsAds.objects.select_related('ser_url_ads').all()
    serializer_class = UrlsAdsSerializer
    # permission_classes = [permissions.IsAuthenticated]

#
# class CianPhotoViewSet(viewsets.ModelViewSet):
#
#     queryset = CianPhoto.objects.all()
#     serializer_class = CianPhotoSerializer

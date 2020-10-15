from django.contrib.auth.models import User, Group
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import viewsets, filters
from rest_framework import permissions
from cian_parser.serializers import UrlsAdsSerializer, InformationFromAdsSerializer
from cian_parser.models import InformationFromAds, UrlsAds


class InformationFromAdsViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows users to be viewed or edited.
    """
    queryset = InformationFromAds.objects.all()
    serializer_class = InformationFromAdsSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    search_fields = ('$phone', '$house_info', '$description', '$general_information', '$description_info')
    filterset_fields = ('phone',)


class UrlsAdsViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows groups to be viewed or edited.
    """
    queryset = UrlsAds.objects.all()
    serializer_class = UrlsAdsSerializer
    permission_classes = [permissions.IsAuthenticated]

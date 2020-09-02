from django.contrib.auth.models import User, Group
from rest_framework import viewsets
from rest_framework import permissions
from cian_parser.serializers import UserSerializer, GroupSerializer
from cian_parser.models import InformationFromAds, UrlsAds


class UserViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows users to be viewed or edited.
    """
    queryset = InformationFromAds.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]


class GroupViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows groups to be viewed or edited.
    """
    queryset = UrlsAds.objects.all()
    serializer_class = GroupSerializer
    permission_classes = [permissions.IsAuthenticated]

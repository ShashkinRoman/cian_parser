from django.contrib import admin
from django.urls import include, path
from rest_framework import routers
from cian_parser.views import InformationFromAdsViewSet, SerializerInfoViewSet, UrlsAdsViewSet, CianPhotoViewSet, NewOwnersViewSet


router = routers.DefaultRouter()
router.register('informationfromads', InformationFromAdsViewSet, 'informationfromads')
router.register('urlsads', UrlsAdsViewSet, 'urlsads')
router.register('cianphoto', CianPhotoViewSet, 'cianphoto')
router.register('newownersviewset', NewOwnersViewSet, 'newownersviewset')
router.register('serializerinfo', SerializerInfoViewSet, 'serializerinfo')

# Wire up our API using automatic URL routing.
# Additionally, we include login URLs for the browsable API.
urlpatterns = [
    path('', include(router.urls)),
    path('api-auth/', include('rest_framework.urls', namespace='rest_framework')
         ),
    path('admin/', admin.site.urls),
]
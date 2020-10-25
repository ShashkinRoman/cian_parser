from django.contrib import admin
from django.urls import include, path
from rest_framework import routers
from cian_parser import views
from cian_parser import urls_parser

router = routers.DefaultRouter()
router.register(r'InformationFromAds', views.InformationFromAdsViewSet)
router.register(r'UrlsAds   ', views.UrlsAdsViewSet)
router.register(r'SerializerInfo', views.SerializerInfoViewSet)

# Wire up our API using automatic URL routing.
# Additionally, we include login URLs for the browsable API.
urlpatterns = [
    path('', include(router.urls)),
    path('api-auth/', include('rest_framework.urls', namespace='rest_framework')
         ),
    path('admin/', admin.site.urls),
    # path('urls_parser/', include(urls_parser.main()))
]
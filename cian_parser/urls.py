from django.contrib import admin
from django.urls import include, path
from rest_framework import routers
from cian_parser import views


router = routers.DefaultRouter()
router.register(r'InformationFromAds', views.InformationFromAdsViewSet)
router.register(r'UrlsAds', views.UrlsAdsViewSet)
router.register(r'SerializerInfo', views.SerializerInfoViewSet)
router.register(r'CianPhoto', views.CianPhotoViewSet)
router.register(r'NewOwnersViewSet', views.NewOwnersViewSet)

# Wire up our API using automatic URL routing.
# Additionally, we include login URLs for the browsable API.
urlpatterns = [
    path('', include(router.urls)),
    path('api-auth/', include('rest_framework.urls', namespace='rest_framework')
         ),
    path('admin/', admin.site.urls),
]

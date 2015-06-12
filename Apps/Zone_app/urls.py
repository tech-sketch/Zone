from django.conf.urls import include, url
from . import views
from django.conf import settings
from django.conf.urls.static import static


urlpatterns = [
    url(r'^$', views.index, name='index'),
    url(r'map/$', views.map, name='map'),
    url(r'list/$', views.list, name='list'),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)


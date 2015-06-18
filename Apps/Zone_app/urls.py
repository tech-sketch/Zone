from django.conf.urls import include, url
from . import views
from django.conf import settings
from django.conf.urls.static import static


urlpatterns = [
    url(r'^$', views.index, name='index'),
    url(r'^map/$', views.map, name='map'),
    url(r'^list/$', views.list, name='list'),
    url(r'^login/$', 'django.contrib.auth.views.login',
        {'template_name': 'login.html'}, name='login'),
    url(r'^logout/$', views.logout, name='logout'),
    url(r'^detail/(?P<place_id>[0-9]+)$', views.detail, name='detail'),
    url(r'^places_api/$', views.places_api, name='places_api'),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)


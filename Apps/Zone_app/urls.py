from django.conf.urls import include, url
from . import views
from django.conf import settings
from django.conf.urls.static import static


urlpatterns = [
    url(r'^$', views.index, name='index'),
    url(r'^maps/$', views.maps, name='maps'),
    url(r'^table/$', views.table, name='table'),
    url(r'^new/$', views.new, name='new'),
    url(r'^create/$', views.create, name='create'),
    url(r'^login/$', 'django.contrib.auth.views.login',
        {'template_name': 'login.html'}, name='login'),
    url(r'^logout/$', views.logout, name='logout'),
    url(r'^detail/(?P<place_id>[0-9]+)$', views.detail, name='detail'),
    url(r'^places_api/$', views.places_api, name='places_api'),
    url(r'^weather_api/$', views.weather_api, name='weather_api'),
    url(r'^add_point/$', views.add_point, name='add_point'),
    url(r'^save_recommend/$', views.save_recommend, name='save_recommend'),

] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)


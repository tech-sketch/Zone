from django.conf.urls import include, url
from . import views
from django.conf import settings
from django.conf.urls.static import static


urlpatterns = [
    url(r'^$', views.index, name='index'),
    url(r'^map/$', views.maps, name='maps'),
    url(r'^search/$', views.search, name='search'),
    url(r'^signup/$', views.signup, name='signup'),
    url(r'^login/$', 'django.contrib.auth.views.login', {'template_name': 'login.html'}, name='login'),
    url(r'^edit/$', views.user_edit, name='edit'),
    url(r'^mypage/$', views.mypage, name='mypage'),
    url(r'^mypage/recommend_switch$', views.display_recommend, name='display_recommend'),
    url(r'^logout/$', 'django.contrib.auth.views.logout', {'next_page': '/'}, name='logout'),
    url(r'^detail/(?P<place_id>[0-9]+)$', views.detail, name='detail'),
    url(r'^add_point/$', views.add_point, name='add_point'),
    url(r'^recommend/$', views.recommend, name='recommend'),
    url(r'^recommend_form/$', views.recommend_form, name='recommend_form'),
    url(r'^narrow_down/$', views.narrow_down, name='narrow_down'),

] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

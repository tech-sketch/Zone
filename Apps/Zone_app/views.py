
from django.shortcuts import render
from django.template import RequestContext
from django.shortcuts import render_to_response
from .models import *
from django.shortcuts import redirect
from django.contrib import messages
from django.http import HttpResponse
from django.contrib.auth import logout as auth_logout
from django.forms import ModelForm
from django import forms
from datetime import datetime
import requests
import requests, json, functools
from django.http.response import JsonResponse
from django.db.models import Sum
from django.core import serializers

# Create your views here.
def index(request):
    return render_to_response('index.html', {}, context_instance=RequestContext(request))

def maps(request):
    places = []
    location = None
    northeast = None
    southwest = None
    address = ""
    place_name = ""
    moods = Mood.objects.all()
    filter_place = Place.objects.all()
    if request.method == 'POST':
        if request.POST['address']:
            address = request.POST['address']
            url = 'https://maps.google.com/maps/api/geocode/json?address=' + address + '&sensor=false&language=ja&key=AIzaSyBLB765ZTWj_KaYASkZVlCx_EcWZTGyw18'
            result = requests.get(url).json()
            location = result['results'][0]['geometry']['location']
            northeast = result['results'][0]['geometry']['viewport']['northeast']
            southwest = result['results'][0]['geometry']['viewport']['southwest']
            filter_place = filter_place.filter(longitude__gt=southwest['lng'], longitude__lt=northeast['lng'],
                                               latitude__gt=southwest['lat'], latitude__lt=northeast['lat'])
        place_name = request.POST['place_name']
        filter_place = filter_place.filter(name__icontains=place_name)

    for place in filter_place:
        total_point = 0
        place_total_point = place.related_place_point.values('place').annotate(total_point=Sum('point'))
        if len(place_total_point) is not 0:
            total_point = place_total_point[0]['total_point']
        picture = get_top_picture(place.id)
        places.append({'picture': picture, 'name': place.name, 'address':place.address, 'longitude':place.longitude,
                           'latitude': place.latitude, 'wifi_softbank': place.has_tool('wifi_softbank'),
                           'wifi_free': place.has_tool('wifi_free'), 'id': place.id, 'total_point': total_point})
    places = sorted(places, key=lambda x: x['total_point'], reverse=True)
    if 'HTTP_ORIGIN' in request.META:
        http_referer = request.META['HTTP_REFERER'].replace(request.META['HTTP_ORIGIN'], '')
        if http_referer == '/maps/':
            return JsonResponse(json.dumps(places), safe=False)
    return render_to_response('map.html', {'places': places, 'moods': moods, 'address': address, 'place_name': place_name,
                                           'location': location, 'northeast': northeast, 'southwest': southwest},
                              context_instance=RequestContext(request))

def table(request):
    places = []
    if request.method == 'POST':
        searched_places = Place.objects.all()
        checked_list = request.POST.getlist('categories[]')
        searched_places = functools.reduce(lambda a, b: a.filter(category__icontains=b), checked_list, searched_places)
        checked_list = request.POST.getlist('tools[]')
        searched_places = functools.reduce(lambda a, b: a.filter(equipment__tool__en_title__contains=b), checked_list, searched_places)
        for place in searched_places:
            picture = get_top_picture(place.id)
            places.append({'picture': picture, 'name': place.name, 'wifi_softbank': place.has_tool('wifi_softbank'),
                           'wifi_free': place.has_tool('wifi_free'), 'id': place.id})
        return JsonResponse(json.dumps(places), safe=False)
    else:
        for place in Place.objects.all():
            picture = get_top_picture(place.id)
            places.append({'picture': picture, 'name': place.name, 'wifi_softbank': place.has_tool('wifi_softbank'),
                           'wifi_free': place.has_tool('wifi_free'), 'id': place.id})

        return render_to_response('list.html', {'places': places, 'moods': Mood.objects.all(),
                                                'tools': Tool.objects.all()}, context_instance=RequestContext(request))

def weather_api(request):
    url = "http://api.openweathermap.org/data/2.5/weather?lat=" + request.GET['lat'] + "&lon=" + request.GET['lng']
    re = requests.get(url)
    return HttpResponse(str(re.json()))

def places_api(request):
    print(request)
    url = "https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=35.691638,139.704616&radius=50000&keyword=cafe|foo&sensor=false&language=ja&key=AIzaSyAqx3ox6iSZ3599nPe314NQNkbxfg-aXC0";
    # re = requests.get(url)
    # result = str(re.json()
    result = "json"
    return HttpResponse(result)

def detail(request, place_id):
    place = Place.objects.filter(id=place_id)
    pictures = Picture.objects.filter(place_id=place_id)
    moods = Mood.objects.all()
    if len(pictures):
        return render_to_response('detail.html', {"place": place[0], "wifi_softbank": place[0].has_tool('wifi_softbank'),
                                                  "pictures": pictures[0].data, "moods": moods}, context_instance=RequestContext(request))
    else:
        return render_to_response('detail.html', {"place": place[0], "wifi_softbank": place[0].has_tool('wifi_softbank'),
                                                  "moods": moods}, context_instance=RequestContext(request))


def logout(request):
    auth_logout(request)
    messages.success(request, 'ログアウトしました。')
    return redirect('/')

class UserForm(ModelForm):
    password = forms.CharField(widget=forms.PasswordInput)

    class Meta:
        model = NomadUser
        fields = ('username', 'password', 'email', 'nickname', 'age', 'gender', 'job')

def new(request):
    user_form = UserForm()
    moods = Mood.objects.all()
    return render_to_response('new.html', {'user_form': user_form, 'moods': moods}, context_instance=RequestContext(request))

def create(request):
    nomad_user = UserForm(request.POST)
    new_nomad_user = nomad_user.save()
    for mood in Mood.objects.all():
        if mood.en_title in request.POST:
            preference = Preference()
            preference.nomad = new_nomad_user
            preference.mood = mood
            preference.save()
    return redirect('/')

def save_recommend(request):
    for mood_en_title in request.POST.getlist('moods[]'):
        mood = Mood.objects.get(en_title=mood_en_title)
        place = Place.objects.get(id=request.POST['place'])
        place_point = PlacePoint()
        place_point.place = place
        place_point.mood = mood
        place_point.point = int(request.POST['point'])
        place_point.save()
    request.user.point -= int(request.POST['point'])
    request.user.save()
    return HttpResponse("{0},{1}".format(request.user.point, place.name))

def add_point(request):
    place = Place.objects.get(id=request.GET['place_id'])
    check_in_historys = CheckInHistory.objects.filter(create_at__day=datetime.now().strftime("%d"),
                                                      create_at__month=datetime.now().strftime("%m"),
                                                      create_at__year=datetime.now().strftime("%Y"),
                                                      nomad_id=request.user.id,
                                                      place_id=request.GET['place_id'])
    if len(check_in_historys) != 0:
        return HttpResponse("{0},{1}".format(request.user.point, "同じ場所では一日一回までです。"))

    check_in_history = CheckInHistory()
    request.user.point += 10
    request.user.save()
    check_in_history.nomad = request.user
    check_in_history.place = place
    check_in_history.save()
    return HttpResponse("{0},{1}".format(request.user.point, "ポイントが加算されました"))

def get_top_picture(place_id):
    pictures = Picture.objects.filter(place_id=place_id)
    if len(pictures):
        return pictures[0].data.url
    else:
        return ""


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
from django.views.decorators.csrf import csrf_exempt
import  math

# Create your views here.
lat_from_cen = 0.00586331
lng_from_cen = 0.00173597
default_lat_size = 0.002697960583020631
default_zoom_level = 17


def index(request):
    return render_to_response('index.html', {}, context_instance=RequestContext(request))

def recommend(request):
    print(Preference.objects.all().filter(nomad=request.user).values('mood'))
    user_preferences = Preference.objects.all().filter(nomad=request.user).values('mood')
    place_points = PlacePoint.objects.values('place', 'mood').annotate(total_point=Sum('point'))
    recommend_rank = place_points.filter(mood=user_preferences).values('place').annotate(total_point=Sum('point')).order_by('-total_point')
    print("recommend_rank" + str(recommend_rank))
    recommend_place = Place.objects.get(id=recommend_rank[0]['place'])
    pictures = Picture.objects.filter(place_id=recommend_place.id)
    print(str(Picture.objects.all()[0].data))
    if len(pictures):
        picture_url = pictures[0].data.url
    else:
        picture_url = "/media/no_image.png"

    return render_to_response('recommend_detail.html', {'place': recommend_place, 'picture_url': picture_url})

def recommend_form(request):
    print("recommend_form")
    print(request.user.is_authenticated())
    moods = Mood.objects.all()
    return render_to_response("recommend_form.html", {"user": request.user, "moods": moods}, context_instance=RequestContext(request))

def maps(request):
    places = []
    location = {}
    northeast = {}
    southwest = {}
    address = ""
    place_name = ""
    zoom_level = default_zoom_level
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
            zoom_level = get_zoom_level(northeast['lat'], southwest['lat'])
            rate = pow(2, (default_zoom_level-zoom_level))

            filter_place = filter_place.filter(longitude__gt=location['lng']-rate*lng_from_cen,
                                               longitude__lt=location['lng']+rate*lng_from_cen,
                                               latitude__gt=location['lat']-rate*lat_from_cen,
                                               latitude__lt=location['lat']+rate*lat_from_cen)
            print(filter_place)

        place_name = request.POST['place_name']

        filter_place = filter_place.filter(name__icontains=place_name)
        places = sort_by_point(filter_place)

        if 'referrer' in request.POST:
            return JsonResponse(json.dumps({'places': places, 'location': location, 'zoom_level': zoom_level}), safe=False)
        else:
            return render_to_response('map.html', {'places': places, 'moods': moods, 'address': address, 'place_name': place_name,
                                                   'location': location, 'northeast': northeast, 'southwest': southwest,
                                                   'zoom_level': zoom_level},  context_instance=RequestContext(request))
    else:
        places = sort_by_point(filter_place)
        return render_to_response('map.html', {'places': places, 'moods': moods, 'address': address, 'place_name': place_name,
                                               'location': location, 'northeast': northeast, 'southwest': southwest,
                                               'zoom_level': zoom_level},
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
        picture_url = pictures[0].data.url
    else:
        picture_url = "/media/no_image.png"
    return render_to_response('detail.html', {"place": place[0], "wifi_softbank": place[0].has_tool('wifi_softbank'),
                                                  "picture_url": picture_url, "moods": moods}, context_instance=RequestContext(request))

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
    new_nomad_user.set_password(new_nomad_user.password)
    new_nomad_user.save()
    for mood in Mood.objects.all():
        if mood.en_title in request.POST:
            preference = Preference()
            preference.nomad = new_nomad_user
            preference.mood = mood
            preference.save()
    return redirect('/')

def save_recommend(request):
    if request.POST['point'] is "":
        return HttpResponse("ポイントを入力してください。,{0}".format(request.user.point))
    if request.user.point < int(request.POST['point']):
        return HttpResponse("ポイントが足りません。,{0}".format(request.user.point))
    if len(request.POST.getlist('moods[]')) == 0:
        return HttpResponse("好みを一つ以上選択してください。,{0}".format(request.user.point))
    place = Place.objects.get(id=request.POST['place'])
    place.total_point += int(request.POST['point'])
    for mood_en_title in request.POST.getlist('moods[]'):
        mood = Mood.objects.get(en_title=mood_en_title)
        place_point = PlacePoint()
        place_point.place = place
        place_point.mood = mood
        place_point.point = int(request.POST['point'])
        place_point.save()
    place.save()
    request.user.point -= int(request.POST['point'])
    request.user.save()
    return HttpResponse("「{0}」に{1}ポイントを入れました！,{2}".format(place.name, request.POST['point'], request.user.point))

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
        return '/media/no_image.png'

def sort_by_point(places):
    place_list = []
    for place in places:
        total_point = place.total_point
        picture = get_top_picture(place.id)
        place_list.append({'picture': picture, 'name': place.name, 'address': place.address, 'longitude': place.longitude,
                           'latitude': place.latitude, 'wifi_softbank': place.has_tool('wifi_softbank'),
                           'wifi_free': place.has_tool('wifi_free'), 'outlet': place.has_tool('outlet'), 'id': place.id, 'total_point': total_point})
    return sorted(place_list, key=lambda x: x['total_point'], reverse=True)

def get_zoom_level(lat_east, lat_west):
    rate = round((lat_east-lat_west)/(default_lat_size/16), 0)
    print(rate)
    zoom_level = 21
    n = 2
    while rate >= n:
        n *= 2
        zoom_level -= 1
    return zoom_level


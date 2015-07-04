
from django.template import RequestContext
from django.shortcuts import render_to_response
from .models import *
from django.shortcuts import redirect
from django.contrib import messages
from django.http import HttpResponse
from .forms import UserForm
import requests, json
from django.http.response import JsonResponse
from django.db.models import Sum

# Create your views here.
LAT_FROM_CEN = 0.00586331
LNG_FROM_CEN = 0.00173597
DEFAULT_LAT_SIZE = 0.002697960583020631
DEFAULT_ZOOM_LEVEL = 17


def index(request):
    return render_to_response('index.html', {}, context_instance=RequestContext(request))

def recommend(request):
    user_preferences = Preference.objects.filter(nomad=request.user).values('mood')
    place_points = PlacePoint.objects.values('place', 'mood').annotate(total_point=Sum('point'))
    recommend_rank = place_points.filter(mood=user_preferences).values('place').annotate(total_point=Sum('point')).order_by('-total_point')
    recommend_place = Place.objects.get(id=recommend_rank[0]['place'])
    picture_url = recommend_place.get_pictures_url()[0]
    return render_to_response('recommend_detail.html', {'place': recommend_place, 'picture_url': picture_url})

def recommend_form(request):
    moods = Mood.objects.all()
    return render_to_response("recommend_form.html", {"user": request.user, "moods": moods}, context_instance=RequestContext(request))

def maps(request):
    if request.POST:
        return search(request)
    zoom_level = DEFAULT_ZOOM_LEVEL
    moods = Mood.objects.all()
    places = sort_by_point(Place.objects.all())
    return render_to_response('map.html', {'places': places, 'moods': moods, 'zoom_level': zoom_level},
                                                context_instance=RequestContext(request))
def search(request):
    location = {}
    zoom_level = DEFAULT_ZOOM_LEVEL
    all_place = Place.objects.all()
    address = request.POST['address']
    place_name = request.POST['place_name']
    result = connect_geocode_api(address)
    if result['status']=='OK':
        location = result['results'][0]['geometry']['location']
        northeast = result['results'][0]['geometry']['viewport']['northeast']
        southwest = result['results'][0]['geometry']['viewport']['southwest']
        zoom_level = get_zoom_level(northeast['lat'], southwest['lat'])
        rate = pow(2, (DEFAULT_ZOOM_LEVEL - zoom_level))
        all_place = all_place.filter(longitude__gt=location['lng']-rate*LNG_FROM_CEN,
                                     longitude__lt=location['lng']+rate*LNG_FROM_CEN,
                                     latitude__gt=location['lat']-rate*LAT_FROM_CEN,
                                     latitude__lt=location['lat']+rate*LAT_FROM_CEN)
    all_place = all_place.filter(name__icontains=place_name)
    places = sort_by_point(all_place)
    if 'referrer' in request.POST:
        return JsonResponse(json.dumps({'places': places, 'location': location, 'zoom_level': zoom_level}), safe=False)
    else:
        moods = Mood.objects.all()
        return render_to_response('map.html', {'places': places, 'moods': moods, 'address': address,
                                               'place_name': place_name, 'location': location, 'zoom_level': zoom_level},
                                  context_instance=RequestContext(request))

def detail(request, place_id):
    place = Place.objects.get(id=place_id)
    moods = Mood.objects.all()
    if not request.user.is_authenticated():
        #メッセージの削除
        storage = messages.get_messages(request)
        if(len(storage)):
            del storage._loaded_messages[0]
        messages.warning(request, 'チェックイン・おすすめ機能を使うにはログインが必要です。')
    picture_url = place.get_pictures_url()[0]
    return render_to_response('detail.html', {"place": place, "wifi_softbank": place.has_tool('wifi_softbank'),
                                                  "picture_url": picture_url, "moods": moods}, context_instance=RequestContext(request))

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
    if not request.user.can_check_in(request.GET['place_id']):
        return HttpResponse("{0},{1}".format(request.user.point, "同じ場所では一日一回までです。"))

    request.user.point += 10
    request.user.save()
    place = Place.objects.get(id=request.GET['place_id'])
    check_in_history = CheckInHistory()
    check_in_history.nomad = request.user
    check_in_history.place = place
    check_in_history.save()
    return HttpResponse("{0},{1}".format(request.user.point, "ポイントが加算されました"))

def sort_by_point(places):
    place_list = []
    for place in places:
        total_point = place.total_point
        picture = place.get_pictures_url()[0]
        place_list.append({'picture': picture, 'name': place.name, 'address': place.address, 'longitude': place.longitude,
                           'latitude': place.latitude, 'wifi_softbank': place.has_tool('wifi_softbank'),
                           'wifi_free': place.has_tool('wifi_free'), 'outlet': place.has_tool('outlet'), 'id': place.id, 'total_point': total_point})
    return sorted(place_list, key=lambda x: x['total_point'], reverse=True)

def get_zoom_level(lat_east, lat_west):
    rate = round((lat_east-lat_west)/(DEFAULT_LAT_SIZE/16), 0)
    zoom_level = 21
    n = 2
    while rate >= n:
        n *= 2
        zoom_level -= 1
    return zoom_level

def connect_geocode_api(address):
    url = 'https://maps.google.com/maps/api/geocode/json?address=' + address + '&sensor=false&language=ja&key=AIzaSyBLB765ZTWj_KaYASkZVlCx_EcWZTGyw18'
    return requests.get(url).json()

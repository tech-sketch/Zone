
from django.template import RequestContext
from django.shortcuts import render_to_response, render
from .models import *
from django.shortcuts import redirect, render

from django.shortcuts import render_to_response
from django.shortcuts import redirect

from django.contrib import messages
from django.core.urlresolvers import reverse
from django.http import HttpResponse

from .forms import UserForm, MoodForm, ContactForm
import requests, functools
from django.db.models import Sum

from django.db.models import Sum, Count
from django.contrib.auth.decorators import login_required

from .forms import UserForm, UserEditForm
from .models import *

import requests
import functools


# Create your views here.
LAT_FROM_CEN = 0.002265
LNG_FROM_CEN = 0.00439
DEFAULT_LAT_SIZE = 0.002697960583020631
DEFAULT_ZOOM_LEVEL = 17


def index(request):
    if request.method == 'POST':
        form = ContactForm(request.POST)
        if form.is_valid():
            form.save()
            return redirect(reverse('index'))
        else:
            return render(request, 'index.html', {'contact_form': form})
    else:
        return render(request, 'index.html', {'contact_form': ContactForm()})


def recommend(request):
    user_preferences = Preference.objects.filter(nomad=request.user).values('mood')
    place_points = PlacePoint.objects.values('place', 'mood').annotate(total_point=Sum('point'))
    recommend_rank = place_points.filter(mood=user_preferences).values('place').annotate(total_point=Sum('point')).order_by('-total_point')
    recommend_place = Place.objects.get(id=recommend_rank[0]['place'])
    picture_url = recommend_place.get_pictures_url()[0]
    wifi = recommend_place.get_wifi_list()
    return render_to_response('detail.html',
                              {'place': recommend_place, 'picture_url': picture_url,
                               "wifi": ' '.join(wifi), 'outlet': recommend_place.has_tool('outlet')})


def recommend_form(request):
    moods = Mood.objects.all()
    return render_to_response("recommend_form.html", {"user": request.user, "moods": moods},
                              context_instance=RequestContext(request))


def preference_form(request):
    if request.method == 'POST':
        searched_places = Place.objects.filter(id__in=request.POST.getlist('place_id_list[]'))
        checked_list = request.POST.getlist('categories[]')
        searched_places = functools.reduce(lambda a, b: a.filter(category__icontains=b), checked_list, searched_places)
        checked_list = request.POST.getlist('moods[]')
        place_points = PlacePoint.objects.values('place', 'mood').annotate(total_point=Sum('point')).filter(total_point__gte=2)
        searched_places = functools.reduce(lambda a, b: a.filter(id__in=[item['place'] for item in place_points.filter(mood__en_title=b)]),
                                           checked_list, searched_places)
        checked_list = request.POST.getlist('tools[]')
        searched_places = functools.reduce(lambda a, b: a.filter(equipment__tool__en_title__contains=b),
                                           checked_list, searched_places)
        places = get_place_picture_list(searched_places)
        places = sorted(places, key=lambda x: x['total_point'], reverse=True)
        return render_to_response('map.html', {'places': places}, context_instance=RequestContext(request))
    moods = Mood.objects.all()
    tools = Tool.objects.all()
    return render_to_response('preference_form.html', {'moods': moods, 'tools': tools},
                              context_instance=RequestContext(request))


def maps(request):
    if request.POST:
        return search(request)
    zoom_level = DEFAULT_ZOOM_LEVEL
    moods = Mood.objects.all()
    places = get_place_picture_list(Place.objects.all())
    places = sorted(places, key=lambda x: x['total_point'], reverse=True)
    return render_to_response('map.html',
                              {'places': places, 'moods': moods, 'zoom_level': zoom_level},
                              context_instance=RequestContext(request))


def search(request):
    location = {}
    if 'zoom_level' in request.POST:
        zoom_level = int(request.POST['zoom_level'])
    else:
        zoom_level = DEFAULT_ZOOM_LEVEL
    all_place = Place.objects.all()
    address = request.POST['address']
    place_name = request.POST['place_name']
    result = connect_geocode_api(address)
    if result['status'] == 'OK':
        location = result['results'][0]['geometry']['location']
        northeast = result['results'][0]['geometry']['viewport']['northeast']
        southwest = result['results'][0]['geometry']['viewport']['southwest']
        zoom_level = get_zoom_level(northeast['lat'], southwest['lat'])
        rate = pow(2, (DEFAULT_ZOOM_LEVEL - zoom_level))
        all_place = all_place.filter(longitude__gt=location['lng']-rate*LNG_FROM_CEN,
                                     longitude__lt=location['lng']+rate*LNG_FROM_CEN,
                                     latitude__gt=location['lat']-rate*LAT_FROM_CEN,
                                     latitude__lt=location['lat']+rate*LAT_FROM_CEN)
    else:
        pass
    all_place = all_place.filter(name__icontains=place_name)
    places = get_place_picture_list(all_place)
    places = sorted(places, key=lambda x: x['total_point'], reverse=True)
    moods = Mood.objects.all()
    return render_to_response('map.html', {'places': places, 'moods': moods, 'address': address,
                                           'place_name': place_name, 'location': location, 'zoom_level': zoom_level},
                              context_instance=RequestContext(request))


def detail(request, place_id):
    place = Place.objects.get(id=place_id)

    picture_url = place.get_pictures_url()[0]
    wifi = place.get_wifi_list()
    return render_to_response('detail.html',
                              {"place": place, "wifi": ' '.join(wifi), 'outlet': place.has_tool('outlet'),
                               "picture_url": picture_url}, context_instance=RequestContext(request))



def signup(request):
    if request.method == 'POST':
        user_form = UserForm(request.POST)
        mood_form = MoodForm(request.POST)
        if user_form.is_valid() and mood_form.is_valid():
            user = user_form.save()
            for mood in mood_form.cleaned_data['moods']:
                Preference(nomad=user, mood=mood).save()
            return redirect(reverse('index'))
        else:
            return render(request, 'signup.html', {'user_form': user_form, 'mood_form': mood_form})
    else:
        return render(request, 'signup.html', {'user_form': UserForm(), 'mood_form': MoodForm()})



@login_required(login_url='/')
def user_edit(request):
    nomad_user = request.user

    if request.method == 'GET':
        user_form = UserEditForm(initial={'email': nomad_user.email, 'age': nomad_user.age,
                                          'gender': nomad_user.gender, 'job': nomad_user.job})
        return render_to_response('edit.html', {'user_form': user_form},
                                  context_instance=RequestContext(request))
    elif request.method == 'POST':
        nomad_user = NomadUser.objects.get(id=request.user.id)
        user_form = UserEditForm(request.POST, request.FILES)

        if user_form.is_valid():
            nomad_user.email = request.POST['email']
            nomad_user.age = request.POST['age']
            nomad_user.gender = request.POST['gender']
            nomad_user.job = request.POST['job']
            if request.FILES:
                nomad_user.icon = request.FILES['icon']
            nomad_user.save()
        else:
            return render_to_response('edit.html', {'user_form': user_form},
                                      context_instance=RequestContext(request))
    return redirect('/')


@login_required(login_url='/')
def mypage(request):
    check_in_historys = CheckInHistory.objects.filter(nomad_id=request.user.id)
    check_in_historys = check_in_historys.order_by('create_at')

    return render_to_response('mypage.html', {'check_in_historys': check_in_historys},
                              context_instance=RequestContext(request))


@login_required(login_url='/')
def display_recommend(request):
    nomad_user = NomadUser.objects.get(id=request.user.id)
    nomad_user.display_recommend = not nomad_user.display_recommend
    nomad_user.save()
    return redirect('/mypage')


def save_recommend(request):
    place = Place.objects.get(id=request.POST['place'])
    if request.POST['point'] is "":
        return HttpResponse("ポイントを入力してください。, {0}, {1}".format(request.user.point, place.total_point))
    if request.user.point < int(request.POST['point']):
        return HttpResponse("ポイントが足りません。, {0}, {1}".format(request.user.point, place.total_point))
    if len(request.POST.getlist('moods[]')) == 0:
        return HttpResponse("好みを一つ以上選択してください。, {0}, {1}".format(request.user.point, place.total_point))
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
    return HttpResponse("「{0}」に{1}ポイントを入れました！,{2}, {3}".format(place.name, request.POST['point'],
                                                               request.user.point, place.total_point))


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


def get_place_picture_list(places):
    return [place.get_dict() for place in places]



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

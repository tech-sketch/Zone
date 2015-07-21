import functools
from django.template import RequestContext
from django.shortcuts import render, render_to_response, redirect
from django.core.urlresolvers import reverse
from django.http import HttpResponse, HttpResponseBadRequest
from django.db.models import Sum
from django.contrib.auth.decorators import login_required
from .models import *
from .forms import UserForm, MoodForm, ContactForm, UserEditForm
from .utils import Places


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
    if request.method == 'GET':
        address = request.GET.get('address', '')
        place_name = request.GET.get('place_name', '')
        moods = Mood.objects.all()
        return render(request, 'map.html', {'address': address, 'place_name': place_name, 'moods': moods})


def search(request):
    if request.method == 'GET':
        northeast_lng = request.GET.get('northeast_lng', 180)
        northeast_lat = request.GET.get('northeast_lat', 90)
        southwest_lng = request.GET.get('southwest_lng', -90)
        southwest_lat = request.GET.get('southwest_lat', -180)
        place_name = request.GET.get('place_name', '')
        sort_key = request.GET.get('sort_key', 'total_point')
        places = Places()
        places.filter_by_name(place_name)
        for place in places.get_places():
            print(place.latitude)
            print(place.longitude)
        places.filter_by_location(northeast_lng, northeast_lat, southwest_lng, southwest_lat)
        print(places.get_places())
        places.sort_by(sort_key)
        places.to_picture_list()
        print(places.get_places())
        return render(request, 'map.html', {'places': places.get_places()})
    else:
        return HttpResponseBadRequest


def detail(request, place_id):
    place = Place.objects.get(id=place_id)
    user = request.user
    if user.is_authenticated():
        browse_history = BrowseHistory()
        browse_history.save(user, place)
    picture_url = place.get_pictures_url()[0]
    wifi = place.get_wifi_list()
    return render(request, 'detail.html', {"place": place, "wifi": ' '.join(wifi), 'outlet': place.has_tool('outlet'),
                               "picture_url": picture_url})


def signup(request):
    if request.method == 'POST':
        user_form = UserForm(request.POST, request.FILES)
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
            nomad_user.email = user_form.cleaned_data['email']
            nomad_user.age = user_form.cleaned_data['age']
            nomad_user.gender = user_form.cleaned_data['gender']
            nomad_user.job = user_form.cleaned_data['job']
            if request.FILES:
                nomad_user.icon = user_form.cleaned_data['icon']
            nomad_user.save()
        else:
            return render_to_response('edit.html', {'user_form': user_form},
                                      context_instance=RequestContext(request))
    return redirect('/')


@login_required(login_url='/')
def mypage(request):
    check_in_historys = CheckInHistory.objects.filter(nomad_id=request.user.id)
    check_in_historys = check_in_historys.order_by('-create_at')[:10]
    browse_historys = BrowseHistory.objects.filter(nomad=request.user.id)
    browse_historys = browse_historys.order_by('-create_at')[:10]

    return render_to_response('mypage.html',
                              {'check_in_historys': check_in_historys, 'browse_historys': browse_historys},
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
        PlacePoint(place=place, mood=mood, point=int(request.POST['point'])).save()
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
    CheckInHistory(nomad=request.user, place=place).save()
    return HttpResponse("{0},{1}".format(request.user.point, "ポイントが加算されました"))


def get_place_picture_list(places):
    return [place.get_dict() for place in places]



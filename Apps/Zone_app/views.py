from django.template import RequestContext
from django.shortcuts import render, render_to_response, redirect
from django.core.urlresolvers import reverse
from django.http import HttpResponse, Http404
from django.db.models import Sum
from django.contrib.auth.decorators import login_required
from .models import *
from .forms import UserForm, MoodForm, NarrowDownForm, ContactForm, UserEditForm
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
    return render_to_response('detail.html',
                              {'place': recommend_place})


def recommend_form(request):
    moods = Mood.objects.all()
    return render_to_response("recommend_form.html", {"user": request.user, "moods": moods},
                              context_instance=RequestContext(request))


def narrow_down(request):
    if request.method == 'POST':
        place_list = request.POST['place_list'].split(',')
        form = NarrowDownForm(request.POST)
        if form.is_valid():
            places = Places(place_list)
            places.filter_by_categories(form.cleaned_data['categories'])
            places.filter_by_moods(form.cleaned_data['moods'], point_gte=2)
            places.filter_by_tools(form.cleaned_data['tools'])
            places.sort_by()
            return render(request, 'map.html', {'places': places.get_places()})
    return render(request, 'preference_form.html', {'narrow_down_form': NarrowDownForm()})


def maps(request):
    if request.method == 'GET':
        address = request.GET.get('address', '')
        place_name = request.GET.get('place_name', '')
        moods = Mood.objects.all()
        return render(request, 'map.html', {'address': address, 'place_name': place_name, 'moods': moods})
    return Http404


def search(request):
    if request.method == 'GET':
        northeast_lng = request.GET.get('northeast_lng', 180)
        northeast_lat = request.GET.get('northeast_lat', 90)
        southwest_lng = request.GET.get('southwest_lng', -90)
        southwest_lat = request.GET.get('southwest_lat', -180)
        place_name = request.GET.get('place_name', '')
        places = Places()
        places.filter_by_name(place_name)
        places.filter_by_location(northeast_lng, northeast_lat, southwest_lng, southwest_lat)
        places.sort_by()
        return render(request, 'map.html', {'places': places.get_places()})
    else:
        return Http404


def detail(request, place_id):
    place = Place.objects.get(id=place_id)
    user = request.user
    if user.is_authenticated():
        browse_history = BrowseHistory()
        browse_history.save(user, place)
    return render(request, 'detail.html', {"place": place})


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




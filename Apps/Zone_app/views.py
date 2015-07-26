from django.template import RequestContext
from django.shortcuts import render, render_to_response, redirect
from django.core.urlresolvers import reverse
from django.http import HttpResponse, Http404
from django.contrib.auth.decorators import login_required
from .models import *
from .forms import UserForm, MoodForm, NarrowDownForm, ContactForm, UserEditForm, PlacePointForm
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


def maps(request):
    if request.method == 'GET':
        address = request.GET.get('address', '')
        place_name = request.GET.get('place_name', '')
        return render(request, 'map.html', {'address': address, 'place_name': place_name})
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
        places.sort_by('total_point')
        return render(request, 'map.html', {'places': places.get_places()})
    else:
        return Http404


def narrow_down(request):
    if request.method == 'POST':
        place_list = request.POST['place_list'].split(',') if request.POST['place_list'] != '' else []
        form = NarrowDownForm(request.POST)
        if form.is_valid():
            places = Places(place_list)
            places.filter_by_categories(form.cleaned_data['categories'])
            places.filter_by_moods(form.cleaned_data['moods'], point_gte=2)
            places.filter_by_tools(form.cleaned_data['tools'])
            places.sort_by('total_point')
            return render(request, 'map.html', {'places': places.get_places()})
    return render(request, 'preference_form.html', {'narrow_down_form': NarrowDownForm()})


@login_required
def recommend(request):
    user_preferences = Mood.objects.filter(preference__nomad=request.user)
    places = Places()
    places.filter_by_moods(user_preferences)
    if len(places.get_places()) == 0:  # preferenceにマッチするものがなければtotal_pointの最上位をrecommend
        places = Places()
    places.sort_by('total_point')
    return render(request, 'detail.html', {'place': places.get_places()[0]})


def detail(request, place_id):
    place = Place.objects.get(id=place_id)
    user = request.user
    if user.is_authenticated():
        BrowseHistory(nomad=user, place=place).save()
    return render(request, 'detail.html', {'place': place})


def add_point(request):
    if not request.user.can_check_in(request.GET['place_id']):
        return HttpResponse("{0},{1}".format(request.user.point, "同じ場所では一日一回までです。"))
    request.user.point += 10
    request.user.save()
    place = Place.objects.get(id=request.GET['place_id'])
    CheckInHistory(nomad=request.user, place=place).save()
    return HttpResponse("{0},{1}".format(request.user.point, "ポイントが加算されました"))


@login_required
def pay_points(request):
    if request.method == 'GET':
        place_id = request.GET.get('place_id', '')  # TODO idのvalidationが必要
        place_point_form = PlacePointForm(initial={'place': place_id, 'nomad': request.user})
        return render(request, "pay_points.html", {"mood_form": MoodForm(), "place_point_form": place_point_form})
    if request.method == 'POST':
        mood_form = MoodForm(request.POST)
        place_point_form = PlacePointForm(request.POST)
        if mood_form.is_valid() and place_point_form.is_valid():
            place = place_point_form.cleaned_data['place']
            point = place_point_form.cleaned_data['point']
            place.total_point += point
            place.save()
            request.user.point -= point
            request.user.save()
            for mood in mood_form.cleaned_data['moods']:
                PlacePoint(mood=mood, nomad=request.user, place=place, point=point).save()
            return HttpResponse("「{0}」に{1}ポイントを入れました！,{2}, {3}".format(place.name, point,
                                                                       request.user.point, place.total_point))
        return HttpResponse("おすすめできませんでした。")


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


@login_required
def my_page(request):
    check_in_histories = CheckInHistory.objects.filter(nomad_id=request.user.id)
    check_in_histories = check_in_histories.order_by('-create_at')[:10]
    browse_histories = BrowseHistory.objects.filter(nomad=request.user.id)
    browse_histories = browse_histories.order_by('-create_at')[:10]
    return render(request, 'my_page.html', {'check_in_histories': check_in_histories, 'browse_histories': browse_histories})


@login_required
def display_recommend(request):
    nomad_user = NomadUser.objects.get(id=request.user.id)
    nomad_user.display_recommend = not nomad_user.display_recommend
    nomad_user.save()
    return redirect('/my_page')

from django.shortcuts import render, redirect
from django.core.urlresolvers import reverse
from django.http import Http404, JsonResponse
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
    # map.htmlを返却。場所情報はsearch()が返却する。
    if request.method == 'GET':
        address = request.GET.get('address', '')
        place_name = request.GET.get('place_name', '')
        return render(request, 'map.html', {'address': address, 'place_name': place_name})
    return Http404


def search(request):
    # 検索結果のデータを返却
    if request.method == 'GET':
        northeast_lng = request.GET.get('northeast_lng', 180)
        northeast_lat = request.GET.get('northeast_lat', 90)
        southwest_lng = request.GET.get('southwest_lng', -90)
        southwest_lat = request.GET.get('southwest_lat', -180)
        place_name = request.GET.get('place_name', '')
        places = Places()
        places.filter_by_name(place_name)

        # TODO northeast < southwestのときの　処理が必要
        places.filter_by_location(northeast_lng, northeast_lat, southwest_lng, southwest_lat)
        places.sort_by('total_point')
        print(places.get_places())
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


@login_required
def add_point(request):
    if not request.user.can_check_in(request.GET['place_id']):
        return JsonResponse({'message': "同じ場所では一日一回までです", 'user_point': request.user.point})
    request.user.point += 10  # TODO ハードコーディングをやめる
    request.user.save()
    place = Place.objects.get(id=request.GET['place_id'])
    CheckInHistory(nomad=request.user, place=place).save()
    return JsonResponse({'message': "ポイントが加算されました", 'user_point': request.user.point})


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
            return JsonResponse({'message': "「{0}」に{1}ポイントを入れました！".format(place.name, point),
                                 'user_point': request.user.point, 'place_point': place.total_point})
        return JsonResponse({'message': "おすすめできませんでした"})


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


@login_required
def edit_user(request):
    nomad_user = request.user
    if request.method == 'GET':
        user_form = UserEditForm(instance=nomad_user)
        return render(request, 'edit.html', {'user_form': user_form})
    elif request.method == 'POST':
        user_form = UserEditForm(request.POST, request.FILES, instance=nomad_user)
        if user_form.is_valid():
            user_form.save()
        else:
            return render(request, 'edit.html', {'user_form': user_form})
    return redirect(reverse('index'))


@login_required
def my_page(request):
    check_in_histories = CheckInHistory.objects.filter(nomad_id=request.user.id)
    check_in_histories = check_in_histories.order_by('-create_at')[:10]
    browse_histories = BrowseHistory.objects.filter(nomad=request.user.id)
    browse_histories = browse_histories.order_by('-create_at')[:10]
    return render(request, 'my_page.html', {'check_in_histories': check_in_histories,
                                            'browse_histories': browse_histories})


@login_required
def display_recommend(request):
    nomad_user = NomadUser.objects.get(id=request.user.id)
    nomad_user.display_recommend = not nomad_user.display_recommend
    nomad_user.save()
    return redirect(reverse('my_page'))

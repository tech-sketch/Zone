from django.shortcuts import render
from django.template import RequestContext
from django.shortcuts import render_to_response
from .models import NomadUser, Place, Picture, Preference
from django.shortcuts import redirect
from django.contrib import messages
from django.http import HttpResponse
from django.contrib.auth import logout as auth_logout
from django.core.validators import MaxValueValidator, MinValueValidator
from django.forms.widgets import RadioSelect, CheckboxSelectMultiple
from django import forms
import requests


# Create your views here.
def index(request):
    return render_to_response('index.html', {}, context_instance=RequestContext(request))

def map(request):
    places = Place.objects.all()
    return render_to_response('map.html', {'places': places}, context_instance=RequestContext(request))

def list(request):
    places = []
    for place in Place.objects.all():
        pictures = Picture.objects.filter(place_id=place.id)

        # send only data of top picture of places
        if len(pictures):
            places.append({'image': pictures[0].data, 'name': place.name, 'wifi_softbank': place.wifi_softbank,
                           'wifi_free': place.wifi_free, 'id': place.id})
        else:
            places.append({'name': place.name, 'wifi_softbank': place.wifi_softbank, 'wifi_free': place.wifi_free,
                           'id': place.id})

    return render_to_response('list.html', {'places': places}, context_instance=RequestContext(request))

def weather_api(request):
    url = "http://api.openweathermap.org/data/2.5/weather?lat=" + request.GET['lat'] + "&lon=" + request.GET['lng']
    re = requests.get(url)
    return HttpResponse(str(re.json()))

def places_api(request):
    url = "https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=35.691638,139.704616&radius=50000&keyword=cafe|foo&sensor=false&language=ja&key=AIzaSyAqx3ox6iSZ3599nPe314NQNkbxfg-aXC0";
    re = requests.get(url)
    result = str(re.json())
    return HttpResponse(result)

def detail(request, place_id):
    return render_to_response('detail.html', {}, context_instance=RequestContext(request))

def logout(request):
    auth_logout(request)
    messages.success(request, 'ログアウトしました。')
    return redirect('/')

class UserForm(forms.Form):
    GENDER_CHOICES = (
        ('M', '男'),
        ('F', '女'),
    )
    JOB_CHOICES = (
        ('Designer', 'デザイナー'),
        ('Engineer', 'エンジニア'),
        ('Other', 'その他'),
    )
    PREFERENCE_CHOICES = (
        ('Relax', '落ち着いている'),
        ('Retro', 'レトロ'),
        ('Fashionable', 'おしゃれ'),
        ('Coffee', 'コーヒーがおいしい'),
        ('Menu', 'メニューが豊富'),
        ('Frank', '店員が気さく'),
    )
    username = forms.CharField(max_length=40)
    password = forms.CharField(widget=forms.PasswordInput())
    email = forms.CharField(max_length=40)
    nickname = forms.CharField(max_length=40)
    gender = forms.ChoiceField(widget=RadioSelect, choices=GENDER_CHOICES)
    age = forms.IntegerField(validators=[MinValueValidator(7), MaxValueValidator(99)])
    job = forms.ChoiceField(widget=RadioSelect, choices=JOB_CHOICES)
    preference = forms.MultipleChoiceField(required=False, widget=CheckboxSelectMultiple, choices=PREFERENCE_CHOICES)


def new(request):
    form = UserForm()
    return render_to_response('new.html', {'form': form}, context_instance=RequestContext(request))

def create(request):
    nomad_user = NomadUser(username=request.POST['username'], email=request.POST['email'], password=request.POST['password'])
    nomad_user.nickname = request.POST['nickname']
    nomad_user.age = request.POST['age']
    nomad_user.gender = request.POST['gender']
    nomad_user.job = request.POST['job']
    print(Preference._meta.get_all_field_names())
    #for preference in request.POST.getlist('preference'):

    nomad_user.save()
    print("save")
    return redirect('/')

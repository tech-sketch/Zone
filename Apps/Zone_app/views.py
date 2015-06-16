from django.shortcuts import render
from django.template import RequestContext
from django.shortcuts import render_to_response
from .models import Place, Picture

from django.http import HttpResponse
from .models import Place
import requests

# Create your views here.
def index(request):
    return render_to_response('index.html', {}, context_instance=RequestContext(request))

def map(request):
    places = Place.objects.all()
    return render_to_response('map.html', {'places': places}, context_instance=RequestContext(request))

def list(request):
    items = []
    for place in Place.objects.all():
        for picture in Picture.objects.all():
            if picture.place_id == place.id:
                items.append({'image': picture.data, 'name': place.name, 'wifi_softbank': place.wifi_softbank, 'wifi_free': place.wifi_free})

    return render_to_response('list.html', {'items': items}, context_instance=RequestContext(request))


def places_api(request):
    print(request)
    url = "https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=35.691638,139.704616&radius=50000&keyword=cafe|foo&sensor=false&language=ja&key=AIzaSyAqx3ox6iSZ3599nPe314NQNkbxfg-aXC0";
    # re = requests.get(url)
    # result = str(re.json()
    result = "json"
    return HttpResponse(result)

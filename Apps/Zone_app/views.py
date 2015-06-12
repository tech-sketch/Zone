from django.shortcuts import render
from django.template import RequestContext
from django.shortcuts import render_to_response
from .models import Place, Picture

# Create your views here.
def index(request):
    return render_to_response('index.html', {}, context_instance=RequestContext(request))

def map(request):
    return render_to_response('map.html', {}, context_instance=RequestContext(request))

def list(request):
    items = []
    for place in Place.objects.all():
        for picture in Picture.objects.all():
            if picture.place_id == place.id:
                items.append({'image': picture.data, 'name': place.name, 'wifi_sb': place.wifi_softbank})

    return render_to_response('list.html', {'items': items}, context_instance=RequestContext(request))

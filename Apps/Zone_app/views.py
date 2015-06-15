from django.shortcuts import render
from django.template import RequestContext
from django.shortcuts import render_to_response
from django.http import HttpResponse
import requests

# Create your views here.
def index(request):
    return render_to_response('index.html', {}, context_instance=RequestContext(request))

def map(request):
    return render_to_response('map.html', {}, context_instance=RequestContext(request))

def list(request):
    return render_to_response('list.html', {}, context_instance=RequestContext(request))

def places_api(request):
    print(request)
    url = "https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=35.691638,139.704616&radius=50000&keyword=cafe|foo&sensor=false&language=ja&key=AIzaSyAqx3ox6iSZ3599nPe314NQNkbxfg-aXC0";
    re = requests.get(url)
    return HttpResponse(str(re.json()))

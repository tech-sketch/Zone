from django.shortcuts import render
from django.template import RequestContext
from django.shortcuts import render_to_response
# Create your views here.
def index(request):
    return render_to_response('index.html', {}, context_instance=RequestContext(request))

def map(request):
    return render_to_response('map.html', {}, context_instance=RequestContext(request))

def list(request):
    return render_to_response('list.html', {}, context_instance=RequestContext(request))

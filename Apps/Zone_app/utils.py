from operator import attrgetter
from .models import Place, PlacePoint
from django.db.models import Sum, Q


class Places(object):

    def __init__(self, place_id_list=None):
        self._places = Place.objects.filter(id__in=place_id_list) if place_id_list is not None else Place.objects.all()

    def get_places(self):
        return self._places

    def filter_by_location(self, northeast_lng, northeast_lat, southwest_lng, southwest_lat):
        if northeast_lng < southwest_lng:
            self._places = self._places.filter(latitude__gt=southwest_lat, latitude__lt=northeast_lat)
            self._places = self._places.filter(Q(longitude__gt=southwest_lng)|Q(longitude__lt=northeast_lng))
        else:
            self._places = self._places.filter(longitude__gt=southwest_lng, longitude__lt=northeast_lng,
                                               latitude__gt=southwest_lat, latitude__lt=northeast_lat)

    def filter_by_name(self, place_name):
        self._places = self._places.filter(name__icontains=place_name)

    def filter_by_categories(self, category_list):
        for category in category_list:
            self._places = self._places.filter(categories=category)

    def filter_by_moods(self, mood_list, point_gte=1):
        place_points = PlacePoint.objects.values('place', 'mood').annotate(total_point=Sum('point'))
        place_points = place_points.filter(total_point__gte=point_gte)
        for mood in mood_list:
            id_list = [item['place'] for item in place_points.filter(mood=mood)]
            self._places = self._places.filter(id__in=id_list)

    def filter_by_tools(self, tool_list):
        for tool in tool_list:
            self._places = self._places.filter(equipment__tool=tool)

    def sort_by(self, name='total_point'):
        self._places = sorted(self._places, key=attrgetter(name), reverse=True)

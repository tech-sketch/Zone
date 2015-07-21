import requests


class GoogleMapAPI(object):

    LAT_FROM_CEN = 0.002265
    LNG_FROM_CEN = 0.00439
    DEFAULT_LAT_SIZE = 0.002697960583020631
    DEFAULT_ZOOM_LEVEL = 17
    MAX_ZOOM_LEVEL = 21

    def __init__(self):
        self._base_url = 'https://maps.google.com/maps/api/geocode/json?address={address}&sensor=false&language=ja&key=AIzaSyBLB765ZTWj_KaYASkZVlCx_EcWZTGyw18'
        self._result = None

    def filter_suitable_places(self, places):
        rate = self.get_rate()
        location = self.get_location()
        return places.filter(longitude__gt=location['lng'] - rate * self.LNG_FROM_CEN,
                             longitude__lt=location['lng'] + rate * self.LNG_FROM_CEN,
                             latitude__gt=location['lat'] - rate * self.LAT_FROM_CEN,
                             latitude__lt=location['lat'] + rate * self.LAT_FROM_CEN)

    def fetch_detail(self, address):
        try:
            self._result = requests.get(self._base_url.format(address=address)).json()
        except:
            pass

    def is_valid(self):
        return 'status' in self._result and self._result['status'] == 'OK'

    def get_location(self):
        """
        経度と緯度を返す
        :return: {'lat': float, 'lng': float}
        """

        return self._result['results'][0]['geometry']['location'] if self.is_valid() else {}

    def get_northeast_location(self):
        """
        northeastの経度と緯度を返す
        :return: {'lat': float, 'lng': float}
        """
        return self._result['results'][0]['geometry']['viewport']['northeast']

    def get_southwest_location(self):
        """
        southwestの経度と緯度を返す
        :return: {'lat': float, 'lng': float}
        """
        return self._result['results'][0]['geometry']['viewport']['southwest']

    def get_rate(self):
        lat_east = self.get_northeast_location()['lat']
        lat_west = self.get_southwest_location()['lat']
        rate = round((lat_east - lat_west) / (self.DEFAULT_LAT_SIZE / 16), 0)
        return rate

    def get_zoom_level(self):
        if not self.is_valid():
            return self.DEFAULT_ZOOM_LEVEL
        rate = self.get_rate()
        zoom_level = self.MAX_ZOOM_LEVEL
        n = 2
        while n <= rate:
            n *= 2
            zoom_level -= 1
        return zoom_level
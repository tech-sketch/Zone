# -*- coding: utf-8 -*-

import logging
from django.core.management.base import BaseCommand, CommandError
from Apps.Zone_app.models import Place
import requests



def get_googledata(name, address):
    with open('Apps/Zone_app/management/commands/secret.txt', mode='r', encoding='utf-8') as f:
        api_key = f.readline()

    url = 'https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=35.6919496,139.6857137&' \
          'radius=1000&name=' + name + '&keyword =' + address + '&key=' + api_key
    re = requests.get(url)

    return re.json()['results']

class PlaceManager(object):
    def __init__(self, line):
        self.line = line.split(',')
        self.name = self.line[0]
        self.address = self.line[2]
        self.json = get_googledata(self.name, self.address)

    def save(self):
        if len(self.json) == 0:
            return
        result = self.json[0]
        place = Place(google_id=result['id'])
        place.category = ','.join(result['types'])
        place.name = self.name
        place.address = self.address
        place.longitude = result['geometry']['location']['lng']
        place.latitude = result['geometry']['location']['lat']
        #self.place.tell =''
        place.wifi_softbank = 'y'

        print(place.google_id)
        print(place.category)
        print(place.name)
        print(place.address)
        print(result['name'])
        print(result['vicinity'])
        print(place.longitude)
        print(place.latitude)
        print(place.tell)
        print(place.wifi_softbank)

        #self.place.save()



    """
    def _SetJason(self, js):
        return json.loads(js)
    """



class Command(BaseCommand):
    args = ''
    help = 'カスタムAdminコマンドのテストです'

    def handle(self, *args, **options):
        with open('Data/wifi_sb_nishishinjuku.csv', mode='r', encoding='UTF-8') as in_file:

            in_file.readline()
            in_file.readline()

            for line in in_file:
                print(line)
                placemanager = PlaceManager(line)
                placemanager.save()


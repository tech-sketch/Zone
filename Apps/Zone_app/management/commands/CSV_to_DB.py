# -*- coding: utf-8 -*-

from django.core.management.base import BaseCommand
from Apps.Zone_app.models import Place
import requests



def get_googledata(name, address):
    with open('Apps/Zone_app/management/commands/secret.txt', mode='r', encoding='utf-8') as f:
        api_key = f.readline()

    url = 'https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=35.6919496,139.6857137&' \
          'radius=5000&name=' + name + '&keyword =' + address + '&key=' + api_key
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
        with open('Apps/Zone_app/management/commands/outputfile.txt', mode='a', encoding='UTF-8') as out_file:
            out_file.write("google_id".ljust(15, " ") + ':' + place.google_id + '\n')
            out_file.write("category:".ljust(15, " ") +  + place.category + '\n')
            out_file.write("search_name:" + place.name + '\n')
            out_file.write("search_address:" + place.address)
            out_file.write("result_name:" + result['name'] + '\n')
            out_file.write("result_address:" + result['vicinity'] + '\n')
            out_file.write("longitude:" + str(place.longitude) + '\n')
            out_file.write("latitude:" + str(place.latitude) + '\n')
            out_file.write("wifi_softbank:" + place.wifi_softbank + '\n')
            out_file.write('----------------------------------------------\n')

        #self.place.save()


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


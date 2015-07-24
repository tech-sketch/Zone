from datetime import datetime
from django.db import models
from django.contrib.auth.models import AbstractUser
from django.core.validators import MaxValueValidator, MinValueValidator


class NomadUser(AbstractUser):
    GENDER_CHOICES = (
        ('M', '男'),
        ('F', '女'),
    )
    JOB_CHOICES = (
        ('Designer', 'デザイナー'),
        ('Engineer', 'エンジニア'),
        ('Other', 'その他')
    )

    nickname = models.CharField(max_length=40,  null=True, blank=True)
    gender = models.CharField(max_length=10, choices=GENDER_CHOICES, null=True, blank=True)
    age = models.IntegerField(null=True, blank=True)
    job = models.CharField(max_length=20, choices=JOB_CHOICES, null=True, blank=True)
    point = models.IntegerField(validators=[MinValueValidator(0), MaxValueValidator(100000)], default=0)
    icon = models.ImageField(upload_to='icons/', default='icons/no_image.png')
    display_recommend = models.BooleanField(default=True)

    def can_check_in(self, place_id):
        check_in_historys = CheckInHistory.objects.filter(create_at__day=datetime.now().strftime("%d"),
                                                          create_at__month=datetime.now().strftime("%m"),
                                                          create_at__year=datetime.now().strftime("%Y"),
                                                          nomad_id=self.id,
                                                          place_id=place_id)
        return len(check_in_historys) == 0

    def __unicode__(self):
        return self.icon


class Category(models.Model):
    def __str__(self):
        return self.jp_title
    jp_title = models.CharField(max_length=40)


class Place(models.Model):
    def __str__(self):
        return self.name + '(' + self.address + ')'

    google_id = models.CharField(max_length=100, null=True, blank=True)
    nomad = models.ForeignKey(NomadUser)
    category = models.CharField(max_length=100, null=True, blank=True)
    categories = models.ManyToManyField(Category, null=True)
    name = models.CharField(max_length=100, null=True, blank=True)
    name_kana = models.CharField(max_length=100, null=True, blank=True)
    address = models.CharField(max_length=200, null=True, blank=True)
    longitude = models.FloatField(null=True, blank=True)
    latitude = models.FloatField(null=True, blank=True)
    tell = models.CharField(max_length=15, null=True, blank=True)
    seats_num = models.IntegerField(validators=[MinValueValidator(0)], null=True, blank=True)
    url_pc = models.CharField(max_length=200, null=True, blank=True)
    url_mobile = models.CharField(max_length=200, null=True, blank=True)
    open_time = models.CharField(max_length=100, null=True, blank=True)
    holiday = models.CharField(max_length=100, null=True, blank=True)
    pr = models.CharField(max_length=400, null=True, blank=True)
    add_date = models.TimeField(auto_now_add=True)
    total_point = models.IntegerField(validators=[MinValueValidator(0), MaxValueValidator(100000)], default=0)

    def has_tool(self, tool):
        return Equipment.objects.filter(place_id=self.id, tool__en_title__exact=tool).exists()

    def has_outlet(self):
        return self.has_tool('outlet')

    def get_wifi_carrier_list(self):
        wifis = WiFi.objects.filter(equipment__place_id=self.id)
        wifi_list = [wifi.carrier_name for wifi in wifis]
        return wifi_list

    def get_pictures_url(self):
        pictures = Picture.objects.filter(place_id=self.id)
        if len(pictures):
            return [x.data.url for x in pictures]
        else:
            return ["/media/no_image.png"]

    def get_main_picture_url(self):
        return self.get_pictures_url()[0]


class Picture(models.Model):
    def __str__(self):
        return self.data.url + '({0})'.format(self.place.name)
    place = models.ForeignKey(Place)
    nomad = models.ForeignKey(NomadUser)
    data = models.ImageField()
    add_date = models.TimeField(auto_now_add=True)


class Tool(models.Model):
    def __str__(self):
        return self.jp_title
    jp_title = models.CharField(max_length=40)
    en_title = models.CharField(max_length=40)

class WiFi(Tool):
    def __str__(self):
        return self.carrier_name
    carrier_name = models.CharField(max_length=40)

    def save(self, carrier_name=None, commit=True):
        if carrier_name is not None:
            self.carrier_name = carrier_name
            self.jp_title = 'Wi-Fi（{0}）'.format(carrier_name)
            self.en_title = 'wifi_{0}'.format(carrier_name)
        if commit:
            super(WiFi, self).save()
        return self

class Equipment(models.Model):
    def __str__(self):
        return self.place.name + "({0})".format(self.tool.jp_title)
    place = models.ForeignKey(Place)
    tool = models.ForeignKey(Tool)


class Mood(models.Model):
    def __str__(self):
        return self.jp_title
    jp_title = models.CharField(max_length=40)
    en_title = models.CharField(max_length=40)


class Preference(models.Model):
    def __str__(self):
        return self.nomad.username + "({0})".format(self.mood.jp_title)
    nomad = models.ForeignKey(NomadUser)
    mood = models.ForeignKey(Mood)


class PlacePoint(models.Model):
    def __str__(self):
        return self.place.name + ':{0}({1}point)'.format(self.mood.jp_title, self.point)
    place = models.ForeignKey(Place, related_name="related_place_point")
    mood = models.ForeignKey(Mood)
    point = models.IntegerField(validators=[MinValueValidator(0), MaxValueValidator(100)], default=0)


class CheckInHistory(models.Model):
    def __str__(self):
        return self.create_at.strftime('%Y/%m/%d %H:%M:%S') + ' {0}'.format(self.place.name) + '({0})'.format(self.nomad.username)
    nomad = models.ForeignKey(NomadUser)
    place = models.ForeignKey(Place)
    create_at = models.DateTimeField(default=datetime.now)


class Contact(models.Model):

    def __str__(self):
        return 'By {name}: {message}'.format(name=self.name, message=self.message)

    name = models.CharField(max_length=40, blank=False)
    email = models.EmailField(blank=False)
    message = models.TextField(blank=False)


class BrowseHistory(models.Model):
    def __str__(self):
        return self.create_at.strftime('%Y/%m/%d %H:%M:%S') + ' {0}'.format(self.place.name) + '({0})'.format(self.nomad.username)
    nomad = models.ForeignKey(NomadUser)
    place = models.ForeignKey(Place)
    create_at = models.DateTimeField(default=datetime.now)

    def save(self, nomad, place, commit=True):
        self.place = place
        self.nomad = nomad
        if commit:
            super(BrowseHistory, self).save()
        return self




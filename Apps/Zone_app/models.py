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


class Place(models.Model):
    def __str__(self):
        return self.name + '(' + self.address + ')'

    google_id = models.CharField(max_length=100, null=True, blank=True)
    nomad = models.ForeignKey(NomadUser)
    category = models.CharField(max_length=100, null=True, blank=True)
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

    def get_wifi_list(self):
        self.wifi_list = []
        if self.has_tool('wifi_free'):
            self.wifi_list.append('Free')
        if self.has_tool('wifi_docomo'):
            self.wifi_list.append('docomo')
        if self.has_tool('wifi_au'):
            self.wifi_list.append('au')
        if self.has_tool('wifi_softbank'):
            self.wifi_list.append('SoftBank')
        if self.has_tool('wifi_wi2'):
            self.wifi_list.append('wi2')
        if self.has_tool('wifi_flets'):
            self.wifi_list.append('Flet\'s')
        if self.has_tool('wifi_BB'):
            self.wifi_list.append('BB')
        return self.wifi_list

    def get_pictures_url(self):
        pictures = Picture.objects.filter(place_id=self.id)
        if len(pictures):
            return [x.data.url for x in pictures]
        else:
            return ["/media/no_image.png"]


class Picture(models.Model):
    def __str__(self):
        return self.data.url + '({0})'.format(self.place.name)
    place = models.ForeignKey(Place)
    nomad = models.ForeignKey(NomadUser)
    data = models.ImageField()
    add_date = models.TimeField(auto_now_add=True)


class Tool(models.Model):
    def __str__(self):
        return self.jp_title + "({0})".format(self.en_title)
    jp_title = models.CharField(max_length=40)
    en_title = models.CharField(max_length=40)


class Equipment(models.Model):
    def __str__(self):
        return self.place.name + "({0})".format(self.tool.jp_title)
    place = models.ForeignKey(Place)
    tool = models.ForeignKey(Tool)


class Mood(models.Model):
    def __str__(self):
        return self.jp_title + "({0})".format(self.en_title)
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
    mood = models.ForeignKey(Mood, null=True, blank=True)
    point = models.IntegerField(validators=[MinValueValidator(0), MaxValueValidator(100000)],
                                null=True, blank=True, default=0)


class CheckInHistory(models.Model):
    def __str__(self):
        return self.create_at.strftime('%Y/%m/%d %H:%M:%S') + ' {0}'.format(self.place.name) + '({0})'.format(self.nomad.username)
    nomad = models.ForeignKey(NomadUser)
    place = models.ForeignKey(Place)
    create_at = models.DateTimeField(default=datetime.now)

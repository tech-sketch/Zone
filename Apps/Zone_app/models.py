from datetime import datetime
from django.db import models
from django.contrib.auth.models import AbstractUser
from django.core.validators import MaxValueValidator, MinValueValidator

# Create your models here.
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

    nickname = models.CharField(max_length=40)
    gender = models.CharField(max_length=10, choices=GENDER_CHOICES, null=True, blank=True)
    age = models.IntegerField(validators=[MinValueValidator(7), MaxValueValidator(99)], null=True, blank=True)
    job = models.CharField(max_length=20, choices=JOB_CHOICES, null=True, blank=True)
    point = models.IntegerField(validators=[MinValueValidator(0), MaxValueValidator(100000)], default=0)

class Place(models.Model):
    def __str__(self):
        return self.name + '(' + self.address + ')'

    CATEGORY_CHOICES = (
        ('cafe', 'カフェ'),
        ('restaurant', 'レストラン'),
        ('bar', 'バー'),
        ('park', '公園'),
        ('other', 'その他')
    )

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
    URL_PC = models.CharField(max_length=200, null=True, blank=True)
    URL_Mobile = models.CharField(max_length=200, null=True, blank=True)
    open_time = models.CharField(max_length=100, null=True, blank=True)
    holiday = models.CharField(max_length=100, null=True, blank=True)
    PR = models.CharField(max_length=400, null=True, blank=True)
    add_date = models.TimeField(auto_now_add=True)

    def has_tool(self, tool):
        return Equipment.objects.filter(place_id=self.id, tool__en_title__exact=tool).exists()

class Picture(models.Model):
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
    place = models.ForeignKey(Place)
    mood = models.ManyToManyField(Mood)
    point = models.IntegerField(validators=[MinValueValidator(0), MaxValueValidator(100000)], null=True, blank=True)

class CheckInHistory(models.Model):
    def __str__(self):
        return self.create_at.strftime('%Y/%m/%d %H:%M:%S')
    nomad = models.ForeignKey(NomadUser)
    place = models.ForeignKey(Place)
    create_at = models.DateTimeField(default=datetime.now)

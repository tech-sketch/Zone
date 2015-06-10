from django.db import models
from django.contrib.auth.models import AbstractUser
from django.core.validators import MaxValueValidator, MinValueValidator

# Create your models here.
class Nomad(AbstractUser):
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
    gender = models.CharField(max_length=2, choices=GENDER_CHOICES, null=True, blank=True)
    age = models.IntegerField(validators=[MinValueValidator(7), MaxValueValidator(99)], null=True, blank=True)
    job = models.CharField(max_length=2, choices=JOB_CHOICES, null=True, blank=True)


class Place(models.Model):
    EXISTENCE_CHOICES = (
        ('y', 'with'),
        ('n', 'without')
    )
    CATEGORY_CHOICES = (
        ('cafe', 'カフェ'),
        ('restaurant', 'レストランと'),
        ('bar', 'バー'),
        ('park', '公園'),
        ('other', 'その他')
    )

    google_id = models.CharField(max_length=100)
    nomad = models.ForeignKey(Nomad)
    category = models.CharField(max_length=2, choices=CATEGORY_CHOICES, null=True, blank=True)
    name = models.CharField(max_length=100, null=True, blank=True)
    name_kana = models.CharField(max_length=100, null=True, blank=True)
    address = models.CharField(max_length=200, null=True, blank=True)
    longitude = models.FloatField(null=True, blank=True)
    latitude = models.FloatField(null=True, blank=True)
    tell = models.CharField(max_length=15, null=True, blank=True)
    wifi_softbank = models.CharField(max_length=2, choices=EXISTENCE_CHOICES, null=True, blank=True)
    outlet = models.CharField(max_length=2, choices=EXISTENCE_CHOICES, null=True, blank=True)
    seats_num = models.IntegerField(validators=[MinValueValidator(0)], null=True, blank=True)
    URL_PC = models.CharField(max_length=200, null=True, blank=True)
    URL_Mobile = models.CharField(max_length=200, null=True, blank=True)
    open_time = models.CharField(max_length=100, null=True, blank=True)
    holiday = models.CharField(max_length=100, null=True, blank=True)
    PR = models.CharField(max_length=400, null=True, blank=True)

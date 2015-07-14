# -*- coding: utf-8 -*-
from django.forms import ModelForm
from django import forms
from .models import NomadUser



class UserForm(ModelForm):
    username = forms.CharField(widget=forms.TextInput(attrs={'required': 'true'}))
    password = forms.CharField(widget=forms.PasswordInput(attrs={'required': 'true'}))
    email = forms.EmailField(widget=forms.EmailInput(attrs={'required': 'true', 'pattern': '^[a-zA-Z0-9.!#$%&’*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+.[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)?$'}))
    # age = forms.IntegerField(widget=forms.NumberInput(attrs={'min': 7, 'max': 99}))

    class Meta:
        model = NomadUser
        fields = ('username', 'password', 'email', 'age', 'gender', 'job', 'icon')

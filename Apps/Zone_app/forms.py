# -*- coding: utf-8 -*-
from django.forms import ModelForm
from django import forms
from .models import NomadUser


class UserForm(ModelForm):
    username = forms.CharField(widget=forms.TextInput(attrs={'required': 'true'}))
    password = forms.CharField(widget=forms.PasswordInput(attrs={'required': 'true'}))
    email = forms.CharField(widget=forms.EmailInput(attrs={'required': 'true'}))

    class Meta:
        model = NomadUser
        fields = ('username', 'password', 'email', 'age', 'gender', 'job')

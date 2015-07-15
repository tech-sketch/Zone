# -*- coding: utf-8 -*-
from django.forms import ModelForm
from django import forms
from .models import NomadUser, Contact


class UserForm(ModelForm):
    username = forms.CharField(widget=forms.TextInput(attrs={'required': 'true'}))
    password = forms.CharField(widget=forms.PasswordInput(attrs={'required': 'true'}))
    email = forms.EmailField(widget=forms.EmailInput(attrs={'required': 'true', 'pattern': '^[a-zA-Z0-9.!#$%&’*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+.[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)?$'}))
    # age = forms.IntegerField(widget=forms.NumberInput(attrs={'min': 7, 'max': 99}))

    class Meta:
        model = NomadUser
        fields = ('username', 'password', 'email', 'age', 'gender', 'job')


class ContactForm(ModelForm):
    name = forms.CharField(widget=forms.TextInput(attrs={'required': 'true', 'placeholder': 'Name', 'class': 'form-control'}))
    email = forms.EmailField(widget=forms.EmailInput(attrs={'required': 'true', 'placeholder': 'Email',  'class': 'form-control', 'pattern': '^[a-zA-Z0-9.!#$%&’*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+.[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)?$'}))
    message = forms.CharField(widget=forms.Textarea(attrs={'required': 'true', 'placeholder': 'Message', 'class': 'form-control'}))

    class Meta:
        model = Contact
        fields = ('name', 'email', 'message')
from django.contrib import admin
from Apps.Zone_app.models import Place, NomadUser, Picture, Preference, Mood

# Register your models here.
admin.site.register(Place)
admin.site.register(NomadUser)
admin.site.register(Picture)
admin.site.register(Preference)
admin.site.register(Mood)

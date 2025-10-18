from django.contrib import admin
from django.urls import include, path

urlpatterns = [
    path('', include('pw2.urls')),
    path('api/', include('pw2.api.urls')),
    path('admin/', admin.site.urls),
]
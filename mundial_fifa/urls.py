from django.contrib import admin
from django.urls import include, path

urlpatterns = [
    # Incluye las URLs de las vistas que renderizan HTML (index, login)
    path('', include('pw2.urls')),
    
    # Incluye todas las URLs de tu API bajo el prefijo /api/
    path('api/', include('pw2.api.urls')),
    
    # Ruta para el panel de administración
    path('admin/', admin.site.urls),
]
from django.urls import path
from . import views

app_name = 'pw2'

urlpatterns = [
    path('', views.index, name='index'),
    path('login/', views.login, name='login'),
    path('publicaciones/', views.publicaciones, name='publicaciones'),
    path('publicaciones/<int:pk>/', views.detalle_publicacion, name='detalle_publicacion'),
    path('crear-publicacion/', views.crear_publicacion, name='crear_publicacion'),
    path('mi-perfil/', views.mi_perfil, name='mi_perfil'),
    path('editar-perfil/', views.editar_perfil, name='editar_perfil'),
    path('perfil/<str:nickname>/', views.perfil_publico, name='perfil_publico'),

    # --- URLs del Panel de Administrador ---
    path('admin/', views.admin_panel, name='admin_panel'),
    path('admin/publicaciones/', views.admin_publicaciones, name='admin_publicaciones'),
    path('admin/usuarios/', views.admin_usuarios, name='admin_usuarios'),
    path('admin/reportes/', views.admin_reportes, name='admin_reportes'),
    path('admin/paises/', views.admin_paises, name='admin_paises'),
    path('admin/mundiales/', views.admin_mundiales, name='admin_mundiales'),
    path('admin/categorias/', views.admin_categorias, name='admin_categorias'),
]
from django.urls import path
from pw2.api.views import (RegistroView, LoginView, PerfilView, ActualizarPerfilView, 
                           EliminarCuentaView, PublicacionesView, PublicacionDetalleView,
                           ComentariosView, ComentarioDetalleView, ReaccionView,
                           AdminPaisesView, AdminPaisDetalleView, AdminMundialesView,
                           AdminMundialDetalleView, AdminCategoriasView, AdminCategoriaDetalleView,
                           SubirMultimediaView, ReportesView)

app_name = 'pw2_api'

urlpatterns = [
    # Autenticación y Perfil
    path('usuarios/registro/', RegistroView.as_view(), name='registro'),
    path('usuarios/login/', LoginView.as_view(), name='login'),
    path('usuarios/perfil/', PerfilView.as_view(), name='perfil'),
    path('usuarios/perfil/actualizar/', ActualizarPerfilView.as_view(), name='actualizar_perfil'),
    path('usuarios/perfil/eliminar/', EliminarCuentaView.as_view(), name='eliminar_perfil'),

    # Publicaciones y Multimedia
    path('publicaciones/', PublicacionesView.as_view(), name='publicaciones_lista'),
    path('publicaciones/<int:pk>/', PublicacionDetalleView.as_view(), name='publicaciones_detalle'),
    path('publicaciones/<int:publicacion_pk>/multimedia/', SubirMultimediaView.as_view(), name='subir_multimedia'),
    
    # Comentarios
    path('publicaciones/<int:publicacion_pk>/comentarios/', ComentariosView.as_view(), name='comentarios_lista'),
    path('publicaciones/<int:publicacion_pk>/comentarios/<int:comentario_pk>/', ComentarioDetalleView.as_view(), name='comentarios_detalle'),
    
    # Reacciones
    path('publicaciones/<int:publicacion_pk>/reaccionar/', ReaccionView.as_view(), name='publicaciones_reaccionar'),

    # Administración
    path('admin/paises/', AdminPaisesView.as_view(), name='admin_paises'),
    path('admin/paises/<int:pk>/', AdminPaisDetalleView.as_view(), name='admin_pais_detalle'),
    path('admin/mundiales/', AdminMundialesView.as_view(), name='admin_mundiales'),
    path('admin/mundiales/<int:pk>/', AdminMundialDetalleView.as_view(), name='admin_mundial_detalle'),
    path('admin/categorias/', AdminCategoriasView.as_view(), name='admin_categorias'),
    path('admin/categorias/<int:pk>/', AdminCategoriaDetalleView.as_view(), name='admin_categoria_detalle'),
    
    # Reportes
    path('reportes/', ReportesView.as_view(), name='reportes'),
]
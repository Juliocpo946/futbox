from django.urls import path
from pw2.api.views import auth, publicaciones, admin, reportes

app_name = 'pw2_api'

urlpatterns = [
    # Autenticación y Perfil
    path('usuarios/registro/', auth.RegistroView.as_view(), name='registro'),
    path('usuarios/login/', auth.LoginView.as_view(), name='login'),
    path('usuarios/perfil/', auth.PerfilView.as_view(), name='perfil'),
    path('usuarios/perfil/actualizar/', auth.ActualizarPerfilView.as_view(), name='actualizar_perfil'),
    path('usuarios/perfil/actualizar-foto/', auth.ActualizarFotoPerfilView.as_view(), name='actualizar_foto_perfil'),
    path('usuarios/perfil/eliminar/', auth.EliminarCuentaView.as_view(), name='eliminar_perfil'),
    path('usuarios/mis-publicaciones/', publicaciones.MisPublicacionesView.as_view(), name='mis_publicaciones'),
    path('perfil/<str:nickname>/', auth.PerfilPublicoView.as_view(), name='perfil_publico'),
    
    # URL Corregida
    path('perfil/publicaciones/<int:user_id>/', publicaciones.PublicacionesUsuarioPublicoView.as_view(), name='publicaciones_usuario_publico'),

    # Publicaciones y Multimedia
    path('publicaciones/', publicaciones.PublicacionesView.as_view(), name='publicaciones_lista'),
    path('publicaciones/<int:pk>/', publicaciones.PublicacionDetalleView.as_view(), name='publicaciones_detalle'),
    path('publicaciones/<int:publicacion_pk>/multimedia/', publicaciones.SubirMultimediaView.as_view(), name='subir_multimedia'),
    
    # Comentarios
    path('publicaciones/<int:publicacion_pk>/comentarios/', publicaciones.ComentariosView.as_view(), name='comentarios_lista'),
    path('publicaciones/<int:publicacion_pk>/comentarios/<int:comentario_pk>/', publicaciones.ComentarioDetalleView.as_view(), name='comentarios_detalle'),
    
    # Reacciones
    path('publicaciones/<int:publicacion_pk>/reaccionar/', publicaciones.ReaccionView.as_view(), name='publicaciones_reaccionar'),

    # Administración
    path('admin/paises/', admin.AdminPaisesView.as_view(), name='admin_paises'),
    path('admin/paises/<int:pk>/', admin.AdminPaisDetalleView.as_view(), name='admin_pais_detalle'),
    path('admin/mundiales/', admin.AdminMundialesView.as_view(), name='admin_mundiales'),
    path('admin/mundiales/<int:pk>/', admin.AdminMundialDetalleView.as_view(), name='admin_mundial_detalle'),
    path('admin/categorias/', admin.AdminCategoriasView.as_view(), name='admin_categorias'),
    path('admin/categorias/<int:pk>/', admin.AdminCategoriaDetalleView.as_view(), name='admin_categoria_detalle'),
    
    # Reportes
    path('reportes/', reportes.ReportesView.as_view(), name='reportes'),
]
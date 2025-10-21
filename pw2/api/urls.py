from django.urls import path
from pw2.api.views import auth, publicaciones, admin, reportes

app_name = 'pw2_api'

urlpatterns = [
    path('usuarios/registro/', auth.RegistroView.as_view(), name='registro'),
    path('usuarios/login/', auth.LoginView.as_view(), name='login'),
    path('usuarios/logout/', auth.LogoutView.as_view(), name='logout'),
    path('usuarios/perfil/', auth.PerfilView.as_view(), name='perfil'),
    path('usuarios/perfil/actualizar/', auth.ActualizarPerfilView.as_view(), name='actualizar_perfil'),
    path('usuarios/perfil/actualizar-foto/', auth.ActualizarFotoPerfilView.as_view(), name='actualizar_foto_perfil'),
    path('usuarios/perfil/eliminar/', auth.EliminarCuentaView.as_view(), name='eliminar_perfil'),
    path('usuarios/mis-publicaciones/', publicaciones.MisPublicacionesView.as_view(), name='mis_publicaciones'),
    path('perfil/<str:nickname>/', auth.PerfilPublicoView.as_view(), name='perfil_publico'),
    path('perfil/publicaciones/<int:user_id>/', publicaciones.PublicacionesUsuarioPublicoView.as_view(), name='publicaciones_usuario_publico'),

    path('publicaciones/', publicaciones.PublicacionesView.as_view(), name='publicaciones_lista'),
    path('publicaciones/<int:pk>/', publicaciones.PublicacionDetalleView.as_view(), name='publicaciones_detalle'),
    path('publicaciones/<int:publicacion_pk>/multimedia/', publicaciones.SubirMultimediaView.as_view(), name='subir_multimedia'),
    path('publicaciones/<int:publicacion_pk>/comentarios/', publicaciones.ComentariosView.as_view(), name='comentarios_lista'),
    path('publicaciones/<int:publicacion_pk>/comentarios/<int:comentario_pk>/', publicaciones.ComentarioDetalleView.as_view(), name='comentarios_detalle'),
    path('publicaciones/<int:publicacion_pk>/reaccionar/', publicaciones.ReaccionView.as_view(), name='publicaciones_reaccionar'),
    path('publicaciones/categorias/', publicaciones.CategoriasPublicasView.as_view(), name='categorias_publicas'),
    path('publicaciones/mundiales/', publicaciones.MundialesPublicosView.as_view(), name='mundiales_publicos'),

    path('admin/paises/', admin.AdminPaisesView.as_view(), name='admin_paises'),
    path('admin/paises/<int:pk>/', admin.AdminPaisDetalleView.as_view(), name='admin_pais_detalle'),
    path('admin/mundiales/', admin.AdminMundialesView.as_view(), name='admin_mundiales'),
    path('admin/mundiales/<int:pk>/', admin.AdminMundialDetalleView.as_view(), name='admin_mundial_detalle'),
    path('admin/categorias/', admin.AdminCategoriasView.as_view(), name='admin_categorias'),
    path('admin/categorias/<int:pk>/', admin.AdminCategoriaDetalleView.as_view(), name='admin_categoria_detalle'),
    
    path('admin/publicaciones/pendientes/', admin.AdminPublicacionesPendientesView.as_view(), name='admin_publicaciones_pendientes'),
    path('admin/publicaciones/<int:pk>/aprobar/', admin.AdminAprobarPublicacionView.as_view(), name='admin_aprobar_publicacion'),
    path('admin/publicaciones/<int:pk>/rechazar/', admin.AdminRechazarPublicacionView.as_view(), name='admin_rechazar_publicacion'),
    path('admin/usuarios/', admin.AdminUsuariosView.as_view(), name='admin_usuarios'),
    path('admin/usuarios/<int:pk>/', admin.AdminUsuarioDetalleView.as_view(), name='admin_usuario_detalle'),
    path('admin/stats/', admin.AdminStatsView.as_view(), name='admin_stats'),
    
    path('reportes/', reportes.ReportesView.as_view(), name='reportes'),
]
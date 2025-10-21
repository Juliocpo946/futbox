from django.shortcuts import render, redirect

def index(request):
    context = { 'title': 'FutBOX - Inicio' }
    return render(request, 'pw2/index.html', context)

def login(request):
    context = { 'title': 'FutBOX - Iniciar Sesión' }
    return render(request, 'pw2/Login.html', context)

def publicaciones(request):
    context = { 'title': 'FutBOX - Comunidad' }
    return render(request, 'pw2/publicaciones.html', context)

def detalle_publicacion(request, pk):
    context = { 'title': 'FutBOX - Detalle de Publicación', 'publicacion_id': pk }
    return render(request, 'pw2/detalle_publicacion.html', context)

def crear_publicacion(request):
    context = { 'title': 'FutBOX - Crear Publicación' }
    return render(request, 'pw2/crear_publicacion.html', context)

def mi_perfil(request):
    context = { 'title': 'FutBOX - Mi Perfil' }
    return render(request, 'pw2/mi_perfil.html', context)

def editar_perfil(request):
    context = { 'title': 'FutBOX - Editar Perfil' }
    return render(request, 'pw2/editar_perfil.html', context)

def perfil_publico(request, nickname):
    context = {
        'title': f'FutBOX - Perfil de {nickname}',
        'nickname': nickname
    }
    return render(request, 'pw2/perfil_publico.html', context)

def admin_panel(request):
    context = {'title': 'FutBOX - Panel de Administración'}
    return render(request, 'pw2/admin/panel.html', context)

def admin_publicaciones(request):
    context = {'title': 'FutBOX - Moderar Publicaciones'}
    return render(request, 'pw2/admin/admin_publicaciones.html', context)

def admin_usuarios(request):
    context = {'title': 'FutBOX - Gestionar Usuarios'}
    return render(request, 'pw2/admin/admin_usuarios.html', context)

def admin_reportes(request):
    context = {'title': 'FutBOX - Reportes'}
    return render(request, 'pw2/admin/admin_reportes.html', context)

def admin_paises(request):
    context = {'title': 'FutBOX - Gestionar Países'}
    return render(request, 'pw2/admin/gestionar_paises.html', context)

def admin_mundiales(request):
    context = {'title': 'FutBOX - Gestionar Mundiales'}
    return render(request, 'pw2/admin/gestionar_mundiales.html', context)

def admin_categorias(request):
    context = {'title': 'FutBOX - Gestionar Categorías'}
    return render(request, 'pw2/admin/gestionar_categorias.html', context)
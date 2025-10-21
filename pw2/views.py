from django.shortcuts import render, redirect
from django.contrib.auth.decorators import login_required

def index(request):
    context = { 'title': 'FutBOX - Inicio' }
    return render(request, 'pw2/index.html', context)

def login(request):
    if request.user.is_authenticated:
        return redirect('pw2:index')
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

# --- Vistas del Panel de Administrador ---
@login_required
def admin_panel(request):
    if not request.user.rol == 'admin':
        return redirect('pw2:index')
    context = {'title': 'FutBOX - Panel de Administración'}
    return render(request, 'pw2/admin/panel.html', context)

@login_required
def admin_publicaciones(request):
    if not request.user.rol == 'admin':
        return redirect('pw2:index')
    context = {'title': 'FutBOX - Moderar Publicaciones'}
    return render(request, 'pw2/admin/admin_publicaciones.html', context)

@login_required
def admin_usuarios(request):
    if not request.user.rol == 'admin':
        return redirect('pw2:index')
    context = {'title': 'FutBOX - Gestionar Usuarios'}
    return render(request, 'pw2/admin/admin_usuarios.html', context)

@login_required
def admin_reportes(request):
    if not request.user.rol == 'admin':
        return redirect('pw2:index')
    context = {'title': 'FutBOX - Reportes'}
    return render(request, 'pw2/admin/admin_reportes.html', context)

@login_required
def admin_paises(request):
    if not request.user.rol == 'admin':
        return redirect('pw2:index')
    context = {'title': 'FutBOX - Gestionar Países'}
    return render(request, 'pw2/admin/gestionar_paises.html', context)


@login_required
def admin_mundiales(request):
    if not request.user.rol == 'admin':
        return redirect('pw2:index')
    context = {'title': 'FutBOX - Gestionar Mundiales'}
    return render(request, 'pw2/admin/gestionar_mundiales.html', context)

@login_required
def admin_categorias(request):
    if not request.user.rol == 'admin':
        return redirect('pw2:index')
    context = {'title': 'FutBOX - Gestionar Categorías'}
    return render(request, 'pw2/admin/gestionar_categorias.html', context)
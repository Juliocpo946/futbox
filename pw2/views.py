from django.shortcuts import render

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

def buscar(request):
    context = { 'title': 'FutBOX - Resultados de Búsqueda' }
    return render(request, 'pw2/resultados.html', context)

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
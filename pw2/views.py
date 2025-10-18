from django.shortcuts import render

def index(request):
    context = {
        'title': 'Fútbol - Portal de la Copa Mundial de la FIFA',
        'user_name': 'Nombre de Usuario',
        'username_handle': '@Username',
    }
    return render(request, 'pw2/index.html', context)

def login(request):
    context = {
        'title': 'FutBOX - Iniciar Sesión',
    }
    return render(request, 'pw2/Login.html', context)
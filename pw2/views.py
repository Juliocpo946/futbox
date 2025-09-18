from django.shortcuts import render

def index(request):
    """
    View function for the home page of the site.
    """
    context = {
        'title': 'Fútbol - Portal de la Copa Mundial de la FIFA',
        'user_name': 'Nombre de Usuario',
        'username_handle': '@Username',
    }
    return render(request, 'pw2/index.html', context)

def login(request):
    """
    View function for the login page.
    """
    return render(request, 'pw2/Login.html')

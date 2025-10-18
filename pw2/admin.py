from django.contrib import admin
from .models import (
    Usuario, Pais, Mundial, Sede, Categoria, Publicacion,
    Multimedia, MultimediaPublicacion, MultimediaMundial, Comentario, Reaccion
)

admin.site.register(Usuario)
admin.site.register(Pais)
admin.site.register(Mundial)
admin.site.register(Sede)
admin.site.register(Categoria)
admin.site.register(Publicacion)
admin.site.register(Multimedia)
admin.site.register(MultimediaPublicacion)
admin.site.register(MultimediaMundial)
admin.site.register(Comentario)
admin.site.register(Reaccion)
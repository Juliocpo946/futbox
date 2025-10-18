from django.db.models import Q
from pw2.models import Publicacion

class PublicacionRepository:
    def get_all_aprobadas(self, search_query=None):
        queryset = Publicacion.objects.filter(estatus='aprobada')
        if search_query:
            queryset = queryset.filter(
                Q(titulo__icontains=search_query) | Q(descripcion__icontains=search_query)
            )
        return queryset.order_by('-fecha_publicacion')

    def get_by_author(self, user_id):
        return Publicacion.objects.filter(autor_id=user_id).order_by('-fecha_publicacion')

    def get_approved_by_author(self, user_id):
        return Publicacion.objects.filter(autor_id=user_id, estatus='aprobada').order_by('-fecha_publicacion')

    def get_by_id(self, publicacion_id):
        try:
            return Publicacion.objects.get(id=publicacion_id)
        except Publicacion.DoesNotExist:
            return None

    def create(self, autor, data):
        return Publicacion.objects.create(autor=autor, **data)

    def update(self, publicacion_instance, data):
        for attr, value in data.items():
            setattr(publicacion_instance, attr, value)
        publicacion_instance.save()
        return publicacion_instance

    def delete(self, publicacion_instance):
        publicacion_instance.delete()
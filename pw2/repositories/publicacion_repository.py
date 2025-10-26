from django.db.models import Q
from pw2.models import Publicacion

class PublicacionRepository:
    def get_all_aprobadas(self, search_query=None, mundial_id=None, categoria_id=None):
        queryset = Publicacion.objects.filter(
            estatus='aprobada',
            autor__is_active=True,
            categoria__activa=True
        ).select_related('autor', 'categoria', 'mundial')

        if search_query:
            queryset = queryset.filter(
                Q(titulo__icontains=search_query) |
                Q(descripcion__icontains=search_query) |
                Q(autor__nickname__icontains=search_query) |
                Q(autor__nombre__icontains=search_query)
            )

        if mundial_id:
            if mundial_id == 'none':
                queryset = queryset.filter(mundial_id__isnull=True)
            else:
                try:
                    mundial_id_int = int(mundial_id)
                    queryset = queryset.filter(mundial_id=mundial_id_int, mundial__activo=True)
                except ValueError:
                    pass

        if categoria_id:
            queryset = queryset.filter(categoria_id=categoria_id, categoria__activa=True)

        return queryset.order_by('-fecha_publicacion')

    def get_by_author(self, user_id, estatus=None):
        queryset = Publicacion.objects.filter(
            autor_id=user_id,
            autor__is_active=True
        )
        if estatus and estatus in ['aprobada', 'pendiente', 'rechazada', 'eliminada']:
            queryset = queryset.filter(estatus=estatus)
        return queryset.order_by('-fecha_publicacion')


    def get_approved_by_author(self, user_id):
        return Publicacion.objects.filter(
            autor_id=user_id,
            estatus='aprobada',
            autor__is_active=True
        ).order_by('-fecha_publicacion')

    def get_by_id(self, publicacion_id):
        try:
            return Publicacion.objects.select_related(
                'autor',
                'categoria',
                'mundial'
            ).prefetch_related(
                'multimediapublicacion_set__multimedia'
            ).get(
                id=publicacion_id,
                autor__is_active=True
            )
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
        publicacion_instance.estatus = 'eliminada'
        publicacion_instance.save()

    def get_all_pendientes(self):
        return Publicacion.objects.filter(
            estatus='pendiente',
            autor__is_active=True
        ).order_by('fecha_publicacion')
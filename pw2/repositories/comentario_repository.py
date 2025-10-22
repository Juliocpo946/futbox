from pw2.models import Comentario

class ComentarioRepository:
    def get_by_publicacion_aprobados(self, publicacion_id):
        return Comentario.objects.filter(publicacion_id=publicacion_id).order_by('fecha_creacion')

    def get_by_id(self, comentario_id):
        try:
            return Comentario.objects.get(id=comentario_id)
        except Comentario.DoesNotExist:
            return None

    def create(self, usuario, publicacion, data):
        return Comentario.objects.create(usuario=usuario, publicacion=publicacion, **data)
        
    def update(self, comentario_instance, data):
        comentario_instance.comentario = data.get('comentario', comentario_instance.comentario)
        comentario_instance.save()
        return comentario_instance

    def delete(self, comentario_instance):
        comentario_instance.delete()
from pw2.models import Reaccion

class ReaccionRepository:
    def get_by_usuario_publicacion(self, usuario, publicacion):
        try:
            return Reaccion.objects.get(usuario=usuario, publicacion=publicacion)
        except Reaccion.DoesNotExist:
            return None

    def create(self, usuario, publicacion):
        return Reaccion.objects.create(usuario=usuario, publicacion=publicacion)

    def delete(self, reaccion_instance):
        reaccion_instance.delete()
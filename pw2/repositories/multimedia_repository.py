from pw2.models import Multimedia, MultimediaPublicacion

class MultimediaRepository:
    def get_by_id(self, multimedia_id):
        try:
            return Multimedia.objects.get(id=multimedia_id)
        except Multimedia.DoesNotExist:
            return None

    def associate_with_publicacion(self, multimedia_instance, publicacion_instance):
        return MultimediaPublicacion.objects.create(
            multimedia=multimedia_instance,
            publicacion=publicacion_instance
        )

    def delete(self, multimedia_instance):
        multimedia_instance.delete()
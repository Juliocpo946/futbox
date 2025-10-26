from pw2.repositories.multimedia_repository import MultimediaRepository
from pw2.utils.cloudinary_helper import upload_image, delete_image
import re

class MultimediaService:
    def __init__(self):
        self.repo = MultimediaRepository()

    def subir_y_asociar_imagen(self, file, publicacion):
        multimedia_obj = upload_image(file)
        self.repo.associate_with_publicacion(multimedia_obj, publicacion)
        return multimedia_obj

    def eliminar_multimedia(self, multimedia_id, usuario):
        multimedia = self.repo.get_by_id(multimedia_id)
        if not multimedia:
            raise ValueError("El archivo multimedia no existe.")
        

        public_id_match = re.search(r'futbox_multimedia/(.+?)\.\w+$', multimedia.path)
        if public_id_match:
            public_id = f"futbox_multimedia/{public_id_match.group(1)}"
            delete_image(public_id)

        self.repo.delete(multimedia)
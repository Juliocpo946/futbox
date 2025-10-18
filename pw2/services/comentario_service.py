from pw2.repositories.comentario_repository import ComentarioRepository
from pw2.repositories.publicacion_repository import PublicacionRepository

class ComentarioService:
    def __init__(self):
        self.comentario_repo = ComentarioRepository()
        self.publicacion_repo = PublicacionRepository()

    def listar_comentarios(self, publicacion_id):
        return self.comentario_repo.get_by_publicacion_aprobados(publicacion_id)

    def crear_comentario(self, usuario, publicacion_id, data):
        publicacion = self.publicacion_repo.get_by_id(publicacion_id)
        if not publicacion or publicacion.estatus != 'aprobada':
            raise ValueError("La publicación no existe o no está disponible.")
        return self.comentario_repo.create(usuario, publicacion, data)

    def actualizar_comentario(self, usuario, comentario_id, data):
        comentario = self.comentario_repo.get_by_id(comentario_id)
        if not comentario or comentario.usuario != usuario:
            raise PermissionError("No tienes permiso para editar este comentario.")
        return self.comentario_repo.update(comentario, data)

    def eliminar_comentario(self, usuario, comentario_id):
        comentario = self.comentario_repo.get_by_id(comentario_id)
        if not comentario or comentario.usuario != usuario:
            raise PermissionError("No tienes permiso para eliminar este comentario.")
        self.comentario_repo.delete(comentario)
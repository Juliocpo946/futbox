from pw2.repositories.reaccion_repository import ReaccionRepository
from pw2.repositories.publicacion_repository import PublicacionRepository
from pw2.models import Publicacion

class ReaccionService:
    def __init__(self):
        self.reaccion_repo = ReaccionRepository()
        self.publicacion_repo = PublicacionRepository()

    def gestionar_reaccion(self, usuario, publicacion_id):
        publicacion = self.publicacion_repo.get_by_id(publicacion_id)
        if not publicacion or publicacion.estatus != 'aprobada':
            raise ValueError("La publicación no existe o no está disponible.")

        reaccion_existente = self.reaccion_repo.get_by_usuario_publicacion(usuario, publicacion)

        if reaccion_existente:
            self.reaccion_repo.delete(reaccion_existente)
            return {'status': 'reaccion_eliminada'}
        else:
            self.reaccion_repo.create(usuario, publicacion)
            return {'status': 'reaccion_creada'}
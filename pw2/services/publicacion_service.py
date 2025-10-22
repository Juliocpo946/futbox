from pw2.repositories.publicacion_repository import PublicacionRepository

class PublicacionService:
    def __init__(self):
        self.repo = PublicacionRepository()

    def crear_publicacion(self, autor, data):
        return self.repo.create(autor, data)

    def listar_publicaciones(self, search_query=None):
        return self.repo.get_all_aprobadas(search_query)

    def listar_publicaciones_por_autor(self, user_id):
        return self.repo.get_by_author(user_id)
    
    def obtener_detalle(self, publicacion_id, usuario):
        publicacion = self.repo.get_by_id(publicacion_id)
        if not publicacion:
            raise ValueError("Publicación no encontrada.")
        
        if publicacion.estatus == 'aprobada' or publicacion.autor == usuario:
            return publicacion
        
        raise ValueError("Publicación no encontrada o no disponible.")

    def actualizar_publicacion(self, usuario, publicacion_id, data):
        publicacion = self.repo.get_by_id(publicacion_id)
        if not publicacion or publicacion.autor != usuario:
            raise PermissionError("No tienes permiso para editar esta publicación.")
        return self.repo.update(publicacion, data)

    def eliminar_publicacion(self, usuario, publicacion_id):
        publicacion = self.repo.get_by_id(publicacion_id)
        if not publicacion or publicacion.autor != usuario:
            raise PermissionError("No tienes permiso para eliminar esta publicación.")
        self.repo.delete(publicacion)

    def listar_publicaciones_pendientes(self):
        return self.repo.get_all_pendientes()

    def aprobar_publicacion(self, publicacion_id):
        publicacion = self.repo.get_by_id(publicacion_id)
        if not publicacion:
            raise ValueError("Publicación no encontrada.")
        publicacion.estatus = 'aprobada'
        publicacion.save()
        return publicacion

    def rechazar_publicacion(self, publicacion_id):
        publicacion = self.repo.get_by_id(publicacion_id)
        if not publicacion:
            raise ValueError("Publicación no encontrada.")
        publicacion.estatus = 'rechazada'
        publicacion.save()
        return publicacion
from pw2.repositories.categoria_repository import CategoriaRepository

class CategoriaService:
    def __init__(self):
        self.repo = CategoriaRepository()

    def get_all(self):
        return self.repo.get_all_active()

    def get_by_id(self, categoria_id):
        categoria = self.repo.get_by_id(categoria_id)
        if not categoria:
            raise ValueError("Categoría no encontrada.")
        return categoria

    def create(self, data):
        return self.repo.create(data)

    def update(self, categoria_id, data):
        categoria = self.get_by_id(categoria_id)
        return self.repo.update(categoria, data)

    def delete(self, categoria_id):
        categoria = self.get_by_id(categoria_id)
        categoria.activa = False
        categoria.save()
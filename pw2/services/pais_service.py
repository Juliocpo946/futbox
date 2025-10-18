from pw2.repositories.pais_repository import PaisRepository

class PaisService:
    def __init__(self):
        self.repo = PaisRepository()

    def get_all(self):
        return self.repo.get_all()

    def create(self, data):
        return self.repo.create(data)
        
    def get_by_id(self, pais_id):
        pais = self.repo.get_by_id(pais_id)
        if not pais:
            raise ValueError("País no encontrado.")
        return pais

    def update(self, pais_id, data):
        pais = self.get_by_id(pais_id)
        return self.repo.update(pais, data)

    def delete(self, pais_id):
        pais = self.get_by_id(pais_id)
        self.repo.delete(pais)
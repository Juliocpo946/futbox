from pw2.repositories.mundial_repository import MundialRepository

class MundialService:
    def __init__(self):
        self.repo = MundialRepository()

    def get_all(self):
        return self.repo.get_all()

    def get_by_id(self, mundial_id):
        mundial = self.repo.get_by_id(mundial_id)
        if not mundial:
            raise ValueError("Mundial no encontrado.")
        return mundial

    def create(self, data):
        sedes_ids = data.pop('sedes', [])
        return self.repo.create(data, sedes_ids)

    def update(self, mundial_id, data):
        mundial = self.get_by_id(mundial_id)
        sedes_ids = data.pop('sedes', None)
        return self.repo.update(mundial, data, sedes_ids)

    def delete(self, mundial_id):
        mundial = self.get_by_id(mundial_id)
        self.repo.delete(mundial)
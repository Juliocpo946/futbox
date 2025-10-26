from pw2.repositories.mundial_repository import MundialRepository
from pw2.utils.cloudinary_helper import upload_image

class MundialService:
    def __init__(self):
        self.repo = MundialRepository()

    def get_all(self):
        return self.repo.get_all_active()

    def get_by_id(self, mundial_id):
        mundial = self.repo.get_by_id(mundial_id)
        if not mundial:
            raise ValueError("Mundial no encontrado.")
        return mundial

    def create(self, data, files):
        sedes_ids = data.pop('sedes', [])
        data.pop('imagenes', None) 
        
        mundial = self.repo.create(data, sedes_ids)
        
        if not files:
            self.repo.delete(mundial) 
            raise ValueError("Se requiere al menos un archivo multimedia para crear un mundial.")

        try:
            for file in files:
                multimedia_obj = upload_image(file)
                self.repo.associate_multimedia(mundial, multimedia_obj)
        except Exception as e:
             self.repo.delete(mundial)
             raise e

        return mundial

    def update(self, mundial_id, data, files):
        mundial = self.get_by_id(mundial_id)
        sedes_ids = data.pop('sedes', None)
        data.pop('imagenes', None) 

        mundial = self.repo.update(mundial, data, sedes_ids)

        if files:
            self.repo.clear_multimedia(mundial) 
            for file in files:
                multimedia_obj = upload_image(file)
                self.repo.associate_multimedia(mundial, multimedia_obj)

        return mundial

    def delete(self, mundial_id):
        mundial = self.get_by_id(mundial_id)
        mundial.activo = False
        mundial.save()
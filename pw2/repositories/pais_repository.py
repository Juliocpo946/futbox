from pw2.models import Pais

class PaisRepository:
    def get_all(self):
        return Pais.objects.all().order_by('pais')

    def get_by_id(self, pais_id):
        try:
            return Pais.objects.get(id=pais_id)
        except Pais.DoesNotExist:
            return None
    
    def create(self, data):
        return Pais.objects.create(**data)

    def update(self, pais_instance, data):
        pais_instance.pais = data.get('pais', pais_instance.pais)
        pais_instance.save()
        return pais_instance

    def delete(self, pais_instance):
        pais_instance.delete()
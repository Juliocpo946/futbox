from pw2.models import Categoria

class CategoriaRepository:
    def get_all(self):
        return Categoria.objects.filter(activa=True).order_by('nombre')
    
    def get_all_active(self):
        return Categoria.objects.filter(activa=True).order_by('nombre')

    def get_by_id(self, categoria_id):
        try:
            return Categoria.objects.get(id=categoria_id, activa=True)
        except Categoria.DoesNotExist:
            return None

    def create(self, data):
        return Categoria.objects.create(**data)

    def update(self, categoria_instance, data):
        categoria_instance.nombre = data.get('nombre', categoria_instance.nombre)
        categoria_instance.save()
        return categoria_instance

    def delete(self, categoria_instance):
        categoria_instance.activa = False
        categoria_instance.save()
from pw2.models import Mundial, Pais

class MundialRepository:
    def get_all(self):
        return Mundial.objects.all().order_by('-año')

    def get_by_id(self, mundial_id):
        try:
            return Mundial.objects.prefetch_related('sedes').get(id=mundial_id)
        except Mundial.DoesNotExist:
            return None

    def create(self, data, sedes_ids):
        mundial = Mundial.objects.create(**data)
        if sedes_ids:
            sedes = Pais.objects.filter(id__in=sedes_ids)
            mundial.sedes.set(sedes)
        return mundial

    def update(self, mundial_instance, data, sedes_ids):
        mundial_instance.nombre = data.get('nombre', mundial_instance.nombre)
        mundial_instance.año = data.get('año', mundial_instance.año)
        mundial_instance.descripcion = data.get('descripcion', mundial_instance.descripcion)
        if 'imagen_id' in data:
            mundial_instance.imagen_id = data.get('imagen_id')
        mundial_instance.save()
        
        if sedes_ids is not None:
            sedes = Pais.objects.filter(id__in=sedes_ids)
            mundial_instance.sedes.set(sedes)
        return mundial_instance

    def delete(self, mundial_instance):
        mundial_instance.delete()
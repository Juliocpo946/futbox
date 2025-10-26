from pw2.models import Mundial, Pais, MultimediaMundial

class MundialRepository:
    def get_all(self):
        return Mundial.objects.all().order_by('-año')

    def get_by_id(self, mundial_id):
        try:
            return Mundial.objects.prefetch_related('sedes', 'multimedia').get(id=mundial_id)
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
        mundial_instance.save()
        
        if sedes_ids is not None:
            sedes = Pais.objects.filter(id__in=sedes_ids)
            mundial_instance.sedes.set(sedes)
        return mundial_instance

    def delete(self, mundial_instance):
        mundial_instance.delete()

    def associate_multimedia(self, mundial, multimedia):
        MultimediaMundial.objects.create(mundial=mundial, multimedia=multimedia)

    def clear_multimedia(self, mundial):
        MultimediaMundial.objects.filter(mundial=mundial).delete()
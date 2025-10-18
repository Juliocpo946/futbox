from django.db.models import Count, Q
from pw2.models import Publicacion, Usuario, Categoria, Mundial

class ReporteService:
    def generar_reportes(self):
        reportes = {
            'publicaciones_mas_comentadas': self.get_publicaciones_mas_comentadas(),
            'usuarios_mas_activos': self.get_usuarios_mas_activos(),
            'categorias_con_mas_contenido': self.get_categorias_con_mas_contenido(),
            'mundiales_con_mas_interaccion': self.get_mundiales_con_mas_interaccion(),
        }
        return reportes

    def get_publicaciones_mas_comentadas(self, limit=5):
        return Publicacion.objects.filter(estatus='aprobada') \
            .annotate(num_comentarios=Count('comentario')) \
            .order_by('-num_comentarios')[:limit] \
            .values('id', 'titulo', 'num_comentarios')

    def get_usuarios_mas_activos(self, limit=5):
        return Usuario.objects.annotate(
            num_publicaciones=Count('publicacion', distinct=True),
            num_comentarios=Count('comentario', distinct=True)
        ).annotate(
            actividad_total=Count('publicacion', distinct=True) + Count('comentario', distinct=True)
        ).order_by('-actividad_total')[:limit] \
        .values('nickname', 'num_publicaciones', 'num_comentarios', 'actividad_total')

    def get_categorias_con_mas_contenido(self):
        return Categoria.objects.annotate(
            num_publicaciones=Count('publicacion', filter=Q(publicacion__estatus='aprobada'))
        ).order_by('-num_publicaciones') \
        .values('nombre', 'num_publicaciones')

    def get_mundiales_con_mas_interaccion(self):
        return Mundial.objects.annotate(
            num_publicaciones=Count('publicacion', filter=Q(publicacion__estatus='aprobada')),
            num_reacciones=Count('publicacion__reaccion')
        ).annotate(
            interaccion_total=Count('publicacion', filter=Q(publicacion__estatus='aprobada')) + Count('publicacion__reaccion')
        ).order_by('-interaccion_total') \
        .values('año', 'num_publicaciones', 'num_reacciones', 'interaccion_total')
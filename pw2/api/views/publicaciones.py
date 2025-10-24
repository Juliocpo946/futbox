from rest_framework import status, parsers
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from pw2.models import Publicacion, Comentario
from pw2.api.serializers import (
    PublicacionSerializer, PublicacionCreateSerializer, ComentarioSerializer,
    ComentarioCreateSerializer, MultimediaSerializer, CategoriaSerializer, MundialDetalleSerializer
)
from pw2.services.publicacion_service import PublicacionService
from pw2.services.comentario_service import ComentarioService
from pw2.services.reaccion_service import ReaccionService
from pw2.services.multimedia_service import MultimediaService
from pw2.services.categoria_service import CategoriaService
from pw2.services.mundial_service import MundialService
from pw2.utils.logger import log_critical_error

class PublicacionesView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        service = PublicacionService()
        search_query = request.query_params.get('search', None)
        mundial_id = request.query_params.get('mundial', None)
        categoria_id = request.query_params.get('categoria', None)

        publicaciones = service.repo.get_all_aprobadas(
            search_query=search_query,
            mundial_id=mundial_id,
            categoria_id=categoria_id
        )
        serializer = PublicacionSerializer(publicaciones, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = PublicacionCreateSerializer(data=request.data)
        if serializer.is_valid():
            service = PublicacionService()
            nueva_publicacion = service.crear_publicacion(request.user, serializer.validated_data)
            response_serializer = PublicacionSerializer(nueva_publicacion)
            return Response(response_serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class MisPublicacionesView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        service = PublicacionService()
        publicaciones = service.listar_publicaciones_por_autor(request.user.id)
        serializer = PublicacionSerializer(publicaciones, many=True)
        return Response(serializer.data)

class PublicacionDetalleView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        service = PublicacionService()
        try:
            publicacion = service.obtener_detalle(pk, request.user)
            serializer = PublicacionSerializer(publicacion)
            return Response(serializer.data)
        except ValueError as e:
            return Response({"error": str(e)}, status=status.HTTP_404_NOT_FOUND)

    def put(self, request, pk):
        serializer = PublicacionCreateSerializer(data=request.data)
        if serializer.is_valid():
            service = PublicacionService()
            try:
                actualizada = service.actualizar_publicacion(request.user, pk, serializer.validated_data)
                response_serializer = PublicacionSerializer(actualizada)
                return Response(response_serializer.data)
            except PermissionError as e:
                return Response({"error": str(e)}, status=status.HTTP_403_FORBIDDEN)
            except ValueError as e:
                 return Response({"error": str(e)}, status=status.HTTP_404_NOT_FOUND)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        service = PublicacionService()
        try:
            service.eliminar_publicacion(request.user, pk)
            return Response(status=status.HTTP_204_NO_CONTENT)
        except PermissionError as e:
            return Response({"error": str(e)}, status=status.HTTP_403_FORBIDDEN)
        except ValueError as e:
            return Response({"error": str(e)}, status=status.HTTP_404_NOT_FOUND)

class SubirMultimediaView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [parsers.MultiPartParser, parsers.FormParser]

    def post(self, request, publicacion_pk):
        files = request.FILES.getlist('files') # Cambiado a 'files' y getlist
        if not files:
            return Response({'error': 'No se encontraron archivos en la peticion.'}, status=status.HTTP_400_BAD_REQUEST)

        pub_service = PublicacionService()
        multi_service = MultimediaService()
        multimedia_results = []
        errors = []

        try:
            publicacion = pub_service.repo.get_by_id(publicacion_pk)
            if not publicacion:
                 raise ValueError("Publicación no encontrada.")
            if publicacion.autor != request.user:
                raise PermissionError("No tienes permiso para añadir multimedia a esta publicación.")

            for file in files:
                 try:
                    multimedia_obj = multi_service.subir_y_asociar_imagen(file, publicacion)
                    multimedia_results.append(MultimediaSerializer(multimedia_obj).data)
                 except Exception as upload_error:
                    errors.append({'file': file.name, 'error': str(upload_error)})

            if errors:
                 # Decide cómo manejar errores parciales (puedes devolver 207 Multi-Status)
                 return Response({
                     'uploaded': multimedia_results,
                     'errors': errors
                 }, status=status.HTTP_207_MULTI_STATUS if multimedia_results else status.HTTP_400_BAD_REQUEST)

            return Response(multimedia_results, status=status.HTTP_201_CREATED)

        except ValueError as e:
             return Response({'error': str(e)}, status=status.HTTP_404_NOT_FOUND)
        except PermissionError as e:
            return Response({'error': str(e)}, status=status.HTTP_403_FORBIDDEN)
        except Exception as e:
            log_critical_error("Error al subir archivos multimedia.", e)
            return Response({'error': 'Ocurrio un error en el servidor.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class ComentariosView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, publicacion_pk):
        service = ComentarioService()
        comentarios = service.listar_comentarios(publicacion_pk)
        serializer = ComentarioSerializer(comentarios, many=True)
        return Response(serializer.data)

    def post(self, request, publicacion_pk):
        serializer = ComentarioCreateSerializer(data=request.data)
        if serializer.is_valid():
            service = ComentarioService()
            try:
                nuevo_comentario = service.crear_comentario(request.user, publicacion_pk, serializer.validated_data)
                response_serializer = ComentarioSerializer(nuevo_comentario)
                return Response(response_serializer.data, status=status.HTTP_201_CREATED)
            except ValueError as e:
                return Response({"error": str(e)}, status=status.HTTP_404_NOT_FOUND)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class ComentarioDetalleView(APIView):
    permission_classes = [IsAuthenticated]

    def put(self, request, publicacion_pk, comentario_pk):
        serializer = ComentarioCreateSerializer(data=request.data)
        if serializer.is_valid():
            service = ComentarioService()
            try:
                actualizado = service.actualizar_comentario(request.user, comentario_pk, serializer.validated_data)
                response_serializer = ComentarioSerializer(actualizado)
                return Response(response_serializer.data)
            except PermissionError as e:
                return Response({"error": str(e)}, status=status.HTTP_403_FORBIDDEN)
            except ValueError as e:
                return Response({"error": str(e)}, status=status.HTTP_404_NOT_FOUND)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, publicacion_pk, comentario_pk):
        service = ComentarioService()
        try:
            service.eliminar_comentario(request.user, comentario_pk)
            return Response(status=status.HTTP_204_NO_CONTENT)
        except PermissionError as e:
            return Response({"error": str(e)}, status=status.HTTP_403_FORBIDDEN)
        except ValueError as e:
            return Response({"error": str(e)}, status=status.HTTP_404_NOT_FOUND)

class ReaccionView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, publicacion_pk):
        service = ReaccionService()
        try:
            resultado = service.gestionar_reaccion(request.user, publicacion_pk)
            return Response(resultado, status=status.HTTP_200_OK)
        except ValueError as e:
            return Response({"error": str(e)}, status=status.HTTP_404_NOT_FOUND)

class PublicacionesUsuarioPublicoView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, user_id):
        service = PublicacionService()
        publicaciones = service.repo.get_approved_by_author(user_id)
        serializer = PublicacionSerializer(publicaciones, many=True)
        return Response(serializer.data)

class CategoriasPublicasView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        service = CategoriaService()
        categorias = service.get_all()
        serializer = CategoriaSerializer(categorias, many=True)
        return Response(serializer.data)

class MundialesPublicosView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        service = MundialService()
        mundiales = service.get_all()
        serializer = MundialDetalleSerializer(mundiales, many=True)
        return Response(serializer.data)
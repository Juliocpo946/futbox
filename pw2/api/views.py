from rest_framework import status, parsers
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from pw2.models import Publicacion, Comentario, Pais, Mundial, Categoria
from pw2.api.serializers import (
    RegisterSerializer, LoginSerializer, UsuarioSerializer, ActualizarUsuarioSerializer,
    PublicacionSerializer, PublicacionCreateSerializer, ComentarioSerializer, ComentarioCreateSerializer,
    PaisSerializer, MundialSerializer, MundialDetalleSerializer, CategoriaSerializer, MultimediaSerializer,
    PublicProfileSerializer
)
from pw2.services.auth_service import AuthService
from pw2.services.publicacion_service import PublicacionService
from pw2.services.comentario_service import ComentarioService
from pw2.services.reaccion_service import ReaccionService
from pw2.services.pais_service import PaisService
from pw2.services.mundial_service import MundialService
from pw2.services.categoria_service import CategoriaService
from pw2.services.multimedia_service import MultimediaService
from pw2.services.reporte_service import ReporteService
from pw2.utils.logger import log_critical_error
from pw2.utils.permissions import IsAdminUser

# --- VISTAS DE AUTENTICACIÓN Y PERFIL ---

class RegistroView(APIView):
    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            try:
                service = AuthService()
                usuario_creado = service.register_user(serializer.validated_data)
                return Response(usuario_creado, status=status.HTTP_201_CREATED)
            except ValueError as e:
                return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
            except Exception as e:
                log_critical_error("Error inesperado en el registro de usuario.", e)
                return Response({'error': 'Ocurrió un error en el servidor.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class LoginView(APIView):
    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        if serializer.is_valid():
            try:
                service = AuthService()
                tokens = service.login_user(serializer.validated_data)
                return Response(tokens, status=status.HTTP_200_OK)
            except ValueError as e:
                return Response({'error': str(e)}, status=status.HTTP_401_UNAUTHORIZED)
            except Exception as e:
                log_critical_error("Error inesperado en el inicio de sesión.", e)
                return Response({'error': 'Ocurrió un error en el servidor.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class PerfilView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        serializer = UsuarioSerializer(request.user)
        return Response(serializer.data, status=status.HTTP_200_OK)

class ActualizarPerfilView(APIView):
    permission_classes = [IsAuthenticated]
    def put(self, request):
        serializer = ActualizarUsuarioSerializer(request.user, data=request.data, partial=True)
        if serializer.is_valid():
            try:
                service = AuthService()
                usuario_actualizado = service.update_profile(request.user, serializer.validated_data)
                return Response(usuario_actualizado, status=status.HTTP_200_OK)
            except ValueError as e:
                return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
            except Exception as e:
                log_critical_error("Error inesperado al actualizar perfil.", e)
                return Response({'error': 'Ocurrió un error en el servidor.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class EliminarCuentaView(APIView):
    permission_classes = [IsAuthenticated]
    def delete(self, request):
        try:
            service = AuthService()
            service.delete_account(request.user)
            return Response({'mensaje': 'Cuenta eliminada exitosamente.'}, status=status.HTTP_204_NO_CONTENT)
        except Exception as e:
            log_critical_error("Error inesperado al eliminar cuenta.", e)
            return Response({'error': 'Ocurrió un error en el servidor.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class ActualizarFotoPerfilView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [parsers.MultiPartParser, parsers.FormParser]
    def post(self, request):
        if 'file' not in request.data:
            return Response({'error': 'No se encontró el archivo en la petición.'}, status=status.HTTP_400_BAD_REQUEST)
        file = request.data['file']
        service = AuthService()
        try:
            usuario_actualizado = service.update_profile_picture(request.user, file)
            return Response(usuario_actualizado, status=status.HTTP_200_OK)
        except Exception as e:
            log_critical_error("Error al subir la foto de perfil.", e)
            return Response({'error': 'Ocurrió un error en el servidor.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class PerfilPublicoView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request, nickname):
        service = AuthService()
        try:
            perfil_publico = service.get_public_profile(nickname)
            return Response(perfil_publico)
        except ValueError as e:
            return Response({'error': str(e)}, status=status.HTTP_404_NOT_FOUND)

class PublicacionesUsuarioPublicoView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request, user_id):
        service = PublicacionService()
        publicaciones = service.repo.get_approved_by_author(user_id)
        serializer = PublicacionSerializer(publicaciones, many=True)
        return Response(serializer.data)

# --- VISTAS DE PUBLICACIONES, MULTIMEDIA, COMENTARIOS Y REACCIONES ---

class PublicacionesView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        service = PublicacionService()
        search_query = request.query_params.get('search', None)
        publicaciones = service.listar_publicaciones(search_query)
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
            publicacion = service.obtener_detalle(pk)
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
            except Publicacion.DoesNotExist:
                return Response({"error": "Publicación no encontrada."}, status=status.HTTP_404_NOT_FOUND)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        service = PublicacionService()
        try:
            service.eliminar_publicacion(request.user, pk)
            return Response(status=status.HTTP_204_NO_CONTENT)
        except PermissionError as e:
            return Response({"error": str(e)}, status=status.HTTP_403_FORBIDDEN)
        except Publicacion.DoesNotExist:
            return Response({"error": "Publicación no encontrada."}, status=status.HTTP_404_NOT_FOUND)

class SubirMultimediaView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [parsers.MultiPartParser, parsers.FormParser]

    def post(self, request, publicacion_pk):
        if 'file' not in request.data:
            return Response({'error': 'No se encontró el archivo en la petición.'}, status=status.HTTP_400_BAD_REQUEST)
        
        file = request.data['file']
        pub_service = PublicacionService()
        multi_service = MultimediaService()

        try:
            publicacion = pub_service.repo.get_by_id(publicacion_pk)
            if not publicacion or publicacion.autor != request.user:
                return Response({'error': 'Publicación no encontrada o sin permisos.'}, status=status.HTTP_404_NOT_FOUND)

            multimedia_obj = multi_service.subir_y_asociar_imagen(file, publicacion)
            serializer = MultimediaSerializer(multimedia_obj)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        except ValueError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            log_critical_error("Error al subir archivo multimedia.", e)
            return Response({'error': 'Ocurrió un error en el servidor.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

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
            except Comentario.DoesNotExist:
                return Response({"error": "Comentario no encontrado."}, status=status.HTTP_404_NOT_FOUND)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, publicacion_pk, comentario_pk):
        service = ComentarioService()
        try:
            service.eliminar_comentario(request.user, comentario_pk)
            return Response(status=status.HTTP_204_NO_CONTENT)
        except PermissionError as e:
            return Response({"error": str(e)}, status=status.HTTP_403_FORBIDDEN)
        except Comentario.DoesNotExist:
            return Response({"error": "Comentario no encontrado."}, status=status.HTTP_404_NOT_FOUND)

class ReaccionView(APIView):
    permission_classes = [IsAuthenticated]
    def post(self, request, publicacion_pk):
        service = ReaccionService()
        try:
            resultado = service.gestionar_reaccion(request.user, publicacion_pk)
            return Response(resultado, status=status.HTTP_200_OK)
        except ValueError as e:
            return Response({"error": str(e)}, status=status.HTTP_404_NOT_FOUND)

# --- VISTAS DE ADMINISTRACIÓN ---

class AdminPaisesView(APIView):
    permission_classes = [IsAdminUser]
    def get(self, request):
        service = PaisService()
        paises = service.get_all()
        serializer = PaisSerializer(paises, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = PaisSerializer(data=request.data)
        if serializer.is_valid():
            service = PaisService()
            pais = service.create(serializer.validated_data)
            return Response(PaisSerializer(pais).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class AdminPaisDetalleView(APIView):
    permission_classes = [IsAdminUser]
    def put(self, request, pk):
        serializer = PaisSerializer(data=request.data)
        if serializer.is_valid():
            try:
                service = PaisService()
                pais = service.update(pk, serializer.validated_data)
                return Response(PaisSerializer(pais).data)
            except ValueError as e:
                return Response({'error': str(e)}, status=status.HTTP_404_NOT_FOUND)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        try:
            service = PaisService()
            service.delete(pk)
            return Response(status=status.HTTP_204_NO_CONTENT)
        except ValueError as e:
            return Response({'error': str(e)}, status=status.HTTP_404_NOT_FOUND)

class AdminMundialesView(APIView):
    permission_classes = [IsAdminUser]
    def get(self, request):
        service = MundialService()
        mundiales = service.get_all()
        serializer = MundialDetalleSerializer(mundiales, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = MundialSerializer(data=request.data)
        if serializer.is_valid():
            service = MundialService()
            mundial = service.create(serializer.validated_data)
            return Response(MundialDetalleSerializer(mundial).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class AdminMundialDetalleView(APIView):
    permission_classes = [IsAdminUser]
    def get(self, request, pk):
        try:
            service = MundialService()
            mundial = service.get_by_id(pk)
            return Response(MundialDetalleSerializer(mundial).data)
        except ValueError as e:
            return Response({'error': str(e)}, status=status.HTTP_404_NOT_FOUND)

    def put(self, request, pk):
        serializer = MundialSerializer(data=request.data)
        if serializer.is_valid():
            try:
                service = MundialService()
                mundial = service.update(pk, serializer.validated_data)
                return Response(MundialDetalleSerializer(mundial).data)
            except ValueError as e:
                return Response({'error': str(e)}, status=status.HTTP_404_NOT_FOUND)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        try:
            service = MundialService()
            service.delete(pk)
            return Response(status=status.HTTP_204_NO_CONTENT)
        except ValueError as e:
            return Response({'error': str(e)}, status=status.HTTP_404_NOT_FOUND)

class AdminCategoriasView(APIView):
    permission_classes = [IsAdminUser]
    def get(self, request):
        service = CategoriaService()
        categorias = service.get_all()
        serializer = CategoriaSerializer(categorias, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = CategoriaSerializer(data=request.data)
        if serializer.is_valid():
            service = CategoriaService()
            categoria = service.create(serializer.validated_data)
            return Response(CategoriaSerializer(categoria).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class AdminCategoriaDetalleView(APIView):
    permission_classes = [IsAdminUser]
    def put(self, request, pk):
        serializer = CategoriaSerializer(data=request.data)
        if serializer.is_valid():
            try:
                service = CategoriaService()
                categoria = service.update(pk, serializer.validated_data)
                return Response(CategoriaSerializer(categoria).data)
            except ValueError as e:
                return Response({'error': str(e)}, status=status.HTTP_404_NOT_FOUND)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        try:
            service = CategoriaService()
            service.delete(pk)
            return Response(status=status.HTTP_204_NO_CONTENT)
        except ValueError as e:
            return Response({'error': str(e)}, status=status.HTTP_404_NOT_FOUND)

# --- VISTA DE REPORTES ---

class ReportesView(APIView):
    permission_classes = [IsAdminUser]
    def get(self, request):
        try:
            service = ReporteService()
            reportes = service.generar_reportes()
            return Response(reportes, status=status.HTTP_200_OK)
        except Exception as e:
            log_critical_error("Error al generar reportes.", e)
            return Response({'error': 'Ocurrió un error en el servidor.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
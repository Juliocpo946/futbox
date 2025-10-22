from rest_framework import status, parsers
from rest_framework.views import APIView
from rest_framework.response import Response
from pw2.models import Usuario
from pw2.api.serializers import (
    PaisSerializer, MundialSerializer, MundialDetalleSerializer, CategoriaSerializer,
    PublicacionSerializer, UsuarioSerializer
)
from pw2.services.pais_service import PaisService
from pw2.services.mundial_service import MundialService
from pw2.services.categoria_service import CategoriaService
from pw2.services.publicacion_service import PublicacionService
from pw2.services.auth_service import AuthService
from pw2.utils.permissions import IsAdminUser

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
    parser_classes = [parsers.MultiPartParser, parsers.FormParser]

    def get(self, request):
        service = MundialService()
        mundiales = service.get_all()
        serializer = MundialDetalleSerializer(mundiales, many=True)
        return Response(serializer.data)

    def post(self, request):
        service = MundialService()
        mundial = service.create(request.data.dict())
        return Response(MundialDetalleSerializer(mundial).data, status=status.HTTP_201_CREATED)

class AdminMundialDetalleView(APIView):
    permission_classes = [IsAdminUser]
    parser_classes = [parsers.MultiPartParser, parsers.FormParser]

    def get(self, request, pk):
        try:
            service = MundialService()
            mundial = service.get_by_id(pk)
            return Response(MundialDetalleSerializer(mundial).data)
        except ValueError as e:
            return Response({'error': str(e)}, status=status.HTTP_404_NOT_FOUND)

    def post(self, request, pk):
        try:
            service = MundialService()
            mundial = service.update(pk, request.data.dict())
            return Response(MundialDetalleSerializer(mundial).data)
        except ValueError as e:
            return Response({'error': str(e)}, status=status.HTTP_404_NOT_FOUND)

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

class AdminPublicacionesPendientesView(APIView):
    permission_classes = [IsAdminUser]
    def get(self, request):
        service = PublicacionService()
        publicaciones = service.listar_publicaciones_pendientes()
        serializer = PublicacionSerializer(publicaciones, many=True)
        return Response(serializer.data)

class AdminAprobarPublicacionView(APIView):
    permission_classes = [IsAdminUser]
    def put(self, request, pk):
        service = PublicacionService()
        try:
            publicacion = service.aprobar_publicacion(pk)
            return Response(PublicacionSerializer(publicacion).data)
        except ValueError as e:
            return Response({'error': str(e)}, status=status.HTTP_404_NOT_FOUND)

class AdminRechazarPublicacionView(APIView):
    permission_classes = [IsAdminUser]
    def put(self, request, pk):
        service = PublicacionService()
        try:
            publicacion = service.rechazar_publicacion(pk)
            return Response(PublicacionSerializer(publicacion).data)
        except ValueError as e:
            return Response({'error': str(e)}, status=status.HTTP_404_NOT_FOUND)

class AdminUsuariosView(APIView):
    permission_classes = [IsAdminUser]
    def get(self, request):
        service = AuthService()
        usuarios = service.get_all_users()
        serializer = UsuarioSerializer(usuarios, many=True)
        return Response(serializer.data)

class AdminUsuarioDetalleView(APIView):
    permission_classes = [IsAdminUser]
    def put(self, request, pk):
        if request.user.id == pk:
            return Response({'error': 'Un administrador no puede modificarse a sí mismo.'}, status=status.HTTP_403_FORBIDDEN)
        
        service = AuthService()
        try:
            if 'rol' in request.data:
                last_admin = Usuario.objects.filter(rol='admin').count() == 1 and service.usuario_repo.get_by_id(pk).rol == 'admin'
                if last_admin:
                    return Response({'error': 'No se puede cambiar el rol del último administrador.'}, status=status.HTTP_400_BAD_REQUEST)
                
                usuario = service.change_user_role(pk, request.data['rol'])
                return Response(UsuarioSerializer(usuario).data)

            elif 'ban' in request.data:
                usuario = service.ban_user(pk) if request.data['ban'] else service.unban_user(pk)
                return Response(UsuarioSerializer(usuario).data)

            return Response({'error': 'Acción no especificada.'}, status=status.HTTP_400_BAD_REQUEST)
        except ValueError as e:
            return Response({'error': str(e)}, status=status.HTTP_404_NOT_FOUND)

class AdminStatsView(APIView):
    permission_classes = [IsAdminUser]
    def get(self, request):
        pub_service = PublicacionService()
        pending_pubs_count = pub_service.listar_publicaciones_pendientes().count()
        return Response({'publicaciones_pendientes': pending_pubs_count})
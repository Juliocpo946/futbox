from rest_framework import status, parsers
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from pw2.api.serializers import RegisterSerializer, LoginSerializer, UsuarioSerializer, ActualizarUsuarioSerializer, PublicProfileSerializer
from pw2.services.auth_service import AuthService
from pw2.utils.logger import log_critical_error

class RegistroView(APIView):
    def post(self, request):
        print("=" * 50)
        print("DATOS RECIBIDOS EN REGISTRO:")
        print(request.data)
        print("=" * 50)
        
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
        
        print("ERRORES DE VALIDACIÓN:")
        print(serializer.errors)
        print("=" * 50)
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
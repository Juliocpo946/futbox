from django.contrib.auth.hashers import check_password
from rest_framework_simplejwt.tokens import RefreshToken
from pw2.repositories.usuario_repository import UsuarioRepository
from pw2.api.serializers import UsuarioSerializer, PublicProfileSerializer
from pw2.utils.cloudinary_helper import upload_image

class AuthService:
    def __init__(self):
        self.usuario_repo = UsuarioRepository()

    def register_user(self, data):
        if self.usuario_repo.exists_by_email(data['correo']):
            raise ValueError("El correo electrónico ya está en uso.")
        
        if self.usuario_repo.exists_by_nickname(data['nickname']):
            raise ValueError("El nickname ya está en uso.")

        usuario = self.usuario_repo.create(data)
        return UsuarioSerializer(usuario).data

    def login_user(self, data):
        usuario = self.usuario_repo.get_by_email(data['correo'])
        
        # CORRECCIÓN AQUÍ: Usar 'password'
        if usuario is None or not check_password(data['password'], usuario.password):
            raise ValueError("Credenciales inválidas.")
            
        refresh = RefreshToken.for_user(usuario)
        
        return {
            'refresh': str(refresh),
            'access': str(refresh.access_token),
            'usuario': UsuarioSerializer(usuario).data
        }

    def update_profile(self, usuario, data):
        if 'nickname' in data and data['nickname'] != usuario.nickname:
            if self.usuario_repo.exists_by_nickname(data['nickname']):
                raise ValueError("El nickname ya está en uso.")
        
        usuario_actualizado = self.usuario_repo.update(usuario, data)
        return UsuarioSerializer(usuario_actualizado).data

    def update_profile_picture(self, usuario, file):
        multimedia_obj = upload_image(file)
        usuario.foto_perfil = multimedia_obj.path
        usuario.save()
        return UsuarioSerializer(usuario).data
    
    def get_public_profile(self, nickname):
        usuario = self.usuario_repo.get_by_nickname(nickname)
        if not usuario:
            raise ValueError("El usuario no existe.")
        return PublicProfileSerializer(usuario).data

    def delete_account(self, usuario):
        self.usuario_repo.delete(usuario)
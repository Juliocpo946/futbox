from pw2.models import Usuario

class UsuarioRepository:
    def create(self, usuario_data):
        password = usuario_data.pop('password')
        user = Usuario.objects.create_user(password=password, **usuario_data)
        return user

    def get_by_email(self, correo):
        try:
            return Usuario.objects.get(correo=correo)
        except Usuario.DoesNotExist:
            return None

    def get_by_nickname(self, nickname):
        try:
            return Usuario.objects.get(nickname=nickname)
        except Usuario.DoesNotExist:
            return None
            
    def get_by_id(self, user_id):
        try:
            return Usuario.objects.get(id=user_id)
        except Usuario.DoesNotExist:
            return None

    def update(self, usuario_instance, data):
        for attr, value in data.items():
            setattr(usuario_instance, attr, value)
        usuario_instance.save()
        return usuario_instance
        
    def delete(self, usuario_instance):
        usuario_instance.delete()

    def exists_by_email(self, correo):
        return Usuario.objects.filter(correo=correo).exists()

    def exists_by_nickname(self, nickname):
        return Usuario.objects.filter(nickname=nickname).exists()
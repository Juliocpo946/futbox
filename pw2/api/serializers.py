from rest_framework import serializers
from pw2.models import (
    Usuario, Publicacion, Comentario, Reaccion, Pais, Mundial, Categoria,
    Multimedia, MultimediaPublicacion
)

class AuthorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Usuario
        fields = ['nombre', 'nickname', 'foto_perfil']

class PublicProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = Usuario
        fields = ['id', 'nombre', 'nickname', 'foto_perfil', 'fecha_registro']

class UsuarioSerializer(serializers.ModelSerializer):
    class Meta:
        model = Usuario
        fields = ['id', 'nombre', 'apellido_paterno', 'apellido_materno', 'correo', 'nickname', 'rol', 'foto_perfil', 'fecha_nacimiento', 'genero']

class RegisterSerializer(serializers.ModelSerializer):
    class Meta:
        model = Usuario
        fields = ['nombre', 'apellido_paterno', 'apellido_materno', 'correo', 'password', 'nickname', 'fecha_nacimiento', 'genero']
        extra_kwargs = {
            'password': {'write_only': True},
            'apellido_paterno': {'required': False},
            'apellido_materno': {'required': False},
            'fecha_nacimiento': {'required': False},
            'genero': {'required': False}
        }

class LoginSerializer(serializers.Serializer):
    correo = serializers.EmailField()
    password = serializers.CharField(write_only=True)

class ActualizarUsuarioSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=False, allow_blank=True)
    
    class Meta:
        model = Usuario
        fields = ['nombre', 'apellido_paterno', 'apellido_materno', 'nickname', 'fecha_nacimiento', 'genero', 'password']
        extra_kwargs = {
            'password': {'required': False, 'allow_blank': True}
        }

class PaisSerializer(serializers.ModelSerializer):
    class Meta:
        model = Pais
        fields = ['id', 'pais']

class MundialSerializer(serializers.ModelSerializer):
    sedes = serializers.PrimaryKeyRelatedField(queryset=Pais.objects.all(), many=True, required=False)
    class Meta:
        model = Mundial
        fields = ['id', 'año', 'descripcion', 'sedes']

class MundialDetalleSerializer(MundialSerializer):
    sedes = PaisSerializer(many=True, read_only=True)

class CategoriaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Categoria
        fields = ['id', 'nombre']

class MultimediaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Multimedia
        fields = ['id', 'path']

class PublicacionSerializer(serializers.ModelSerializer):
    autor = AuthorSerializer(read_only=True)
    reacciones_count = serializers.SerializerMethodField()
    comentarios_count = serializers.SerializerMethodField()
    categoria = CategoriaSerializer(read_only=True)
    mundial = MundialSerializer(read_only=True)
    multimedia = serializers.SerializerMethodField()

    class Meta:
        model = Publicacion
        fields = ['id', 'titulo', 'descripcion', 'fecha_publicacion', 'autor', 'categoria', 'mundial', 'reacciones_count', 'comentarios_count', 'multimedia', 'estatus']
    
    def get_reacciones_count(self, obj):
        return obj.reaccion_set.count()

    def get_comentarios_count(self, obj):
        return obj.comentario_set.filter(estatus='aprobado').count()

    def get_multimedia(self, obj):
        multimedia_relations = MultimediaPublicacion.objects.filter(publicacion=obj, estatus='agregada')
        multimedia_items = [relation.multimedia for relation in multimedia_relations]
        return MultimediaSerializer(multimedia_items, many=True).data

class PublicacionCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Publicacion
        fields = ['titulo', 'descripcion', 'categoria', 'mundial']

class ComentarioSerializer(serializers.ModelSerializer):
    usuario = AuthorSerializer(read_only=True)
    class Meta:
        model = Comentario
        fields = ['id', 'comentario', 'fecha_creacion', 'usuario']

class ComentarioCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Comentario
        fields = ['comentario']

class ReaccionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Reaccion
        fields = '__all__'
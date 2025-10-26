from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin

class UsuarioManager(BaseUserManager):
    def create_user(self, correo, password=None, **extra_fields):
        if not correo:
            raise ValueError('El correo electrónico es obligatorio')
        correo = self.normalize_email(correo)
        user = self.model(correo=correo, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, correo, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('rol', 'admin')

        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser must have is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser must have is_superuser=True.')
        if extra_fields.get('rol') != 'admin':
            raise ValueError('Superuser must have rol=admin.')

        return self.create_user(correo, password, **extra_fields)

class Usuario(AbstractBaseUser, PermissionsMixin):
    GENERO_CHOICES = [('masculino', 'Masculino'), ('femenino', 'Femenino'), ('otro', 'Otro')]

    nombre = models.CharField(max_length=255)
    apellido_paterno = models.CharField(max_length=255, null=True, blank=True)
    apellido_materno = models.CharField(max_length=255, null=True, blank=True)
    correo = models.EmailField(unique=True)
    foto_perfil = models.CharField(max_length=255, null=True, blank=True)
    genero = models.CharField(max_length=50, choices=GENERO_CHOICES, null=True, blank=True)
    nickname = models.CharField(max_length=255, unique=True)
    fecha_nacimiento = models.DateField(null=True, blank=True)
    fecha_registro = models.DateTimeField(auto_now_add=True)

    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    rol = models.CharField(max_length=50, default='usuario')

    objects = UsuarioManager()

    USERNAME_FIELD = 'correo'
    REQUIRED_FIELDS = ['nombre', 'nickname']

    def __str__(self):
        return self.nickname

class Pais(models.Model):
    pais = models.CharField(max_length=255)
    activo = models.BooleanField(default=True)
    def __str__(self): return self.pais

class Mundial(models.Model):
    nombre = models.CharField(max_length=255, null=True, blank=True)
    año = models.PositiveIntegerField()
    descripcion = models.TextField()
    sedes = models.ManyToManyField("Pais", through="Sede")
    multimedia = models.ManyToManyField("Multimedia", through="MultimediaMundial", blank=True)
    activo = models.BooleanField(default=True)
    def __str__(self): return self.nombre or f"Mundial {self.año}"

class Sede(models.Model):
    mundial = models.ForeignKey("Mundial", on_delete=models.DO_NOTHING)
    sede = models.ForeignKey("Pais", on_delete=models.DO_NOTHING)
    class Meta: unique_together = ("mundial", "sede")

class Categoria(models.Model):
    nombre = models.CharField(max_length=255)
    activa = models.BooleanField(default=True)
    def __str__(self): return self.nombre

class Publicacion(models.Model):
    ESTATUS_CHOICES = [("pendiente", "Pendiente"), ("aprobada", "Aprobada"), ("rechazada", "Rechazada"), ("eliminada", "Eliminada")]
    autor = models.ForeignKey("Usuario", on_delete=models.DO_NOTHING)
    categoria = models.ForeignKey("Categoria", on_delete=models.DO_NOTHING)
    mundial = models.ForeignKey("Mundial", on_delete=models.DO_NOTHING, null=True, blank=True)
    titulo = models.CharField(max_length=255)
    descripcion = models.TextField()
    fecha_publicacion = models.DateTimeField(auto_now_add=True)
    fecha_edicion = models.DateTimeField(auto_now=True)
    estatus = models.CharField(max_length=10, choices=ESTATUS_CHOICES, default="pendiente")
    def __str__(self): return self.titulo

class Multimedia(models.Model):
    MEDIA_TYPES = [('image', 'Image'), ('video', 'Video'), ('unknown', 'Unknown')]
    path = models.CharField(max_length=255)
    media_type = models.CharField(max_length=10, choices=MEDIA_TYPES, default='unknown')
    def __str__(self): return f"{self.media_type}: {self.path}"


class MultimediaPublicacion(models.Model):
    ESTATUS_CHOICES = [("agregada", "Agregada"), ("eliminada", "Eliminada")]
    multimedia = models.ForeignKey("Multimedia", on_delete=models.DO_NOTHING)
    publicacion = models.ForeignKey("Publicacion", on_delete=models.DO_NOTHING)
    estatus = models.CharField(max_length=10, choices=ESTATUS_CHOICES, default="agregada")

class MultimediaMundial(models.Model):
    multimedia = models.ForeignKey("Multimedia", on_delete=models.DO_NOTHING)
    mundial = models.ForeignKey("Mundial", on_delete=models.DO_NOTHING)

class Comentario(models.Model):
    ESTATUS_CHOICES = [
        ("pendiente", "Pendiente"),
        ("aprobado", "Aprobado"),
        ("rechazado", "Rechazado"),
        ("eliminado", "Eliminado"),
    ]
    comentario = models.TextField()
    estatus = models.CharField(max_length=10, choices=ESTATUS_CHOICES, default="aprobado")
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    fecha_edicion = models.DateTimeField(auto_now=True)
    usuario = models.ForeignKey("Usuario", on_delete=models.DO_NOTHING)
    publicacion = models.ForeignKey("Publicacion", on_delete=models.DO_NOTHING)
    def __str__(self): return f"Comentario de {self.usuario.nickname}"

class Reaccion(models.Model):
    usuario = models.ForeignKey("Usuario", on_delete=models.DO_NOTHING)
    publicacion = models.ForeignKey("Publicacion", on_delete=models.DO_NOTHING, null=True, blank=True)
    def __str__(self): return f"Reacción de {self.usuario.nickname} en {self.publicacion.titulo if self.publicacion else '---'}"
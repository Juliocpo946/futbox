from django.db import models

# Create your models here.
from django.db import models


# ==============================
# TABLA USUARIO
# ==============================
class Usuario(models.Model):
    GENERO_CHOICES = [
        ('masculino', 'Masculino'),
        ('femenino', 'Femenino'),
        ('otro', 'Otro'),
    ]
    
    nombre = models.CharField(max_length=255)
    apellido_paterno = models.CharField(max_length=255, null=True, blank=True)
    apellido_materno = models.CharField(max_length=255, null=True, blank=True)
    correo = models.EmailField(unique=True)
    contraseña = models.CharField(max_length=255)
    foto_perfil = models.CharField(max_length=255, null=True, blank=True)
    genero = models.CharField(max_length=50, choices=GENERO_CHOICES, null=True, blank=True)
    nickname = models.CharField(max_length=255, unique=True)
    fecha_nacimiento = models.DateField(null=True, blank=True)
    fecha_registro = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.nickname


# ==============================
# TABLA PAIS
# ==============================
class Pais(models.Model):
    pais = models.CharField(max_length=255)

    def __str__(self):
        return self.pais


# ==============================
# TABLA MUNDIAL
# ==============================
class Mundial(models.Model):
    año = models.PositiveIntegerField()
    descripcion = models.TextField()

    sedes = models.ManyToManyField("Pais", through="Sede")

    def __str__(self):
        return f"Mundial {self.año}"


class Sede(models.Model):
    mundial = models.ForeignKey("Mundial", on_delete=models.DO_NOTHING)
    sede = models.ForeignKey("Pais", on_delete=models.DO_NOTHING)

    class Meta:
        unique_together = ("mundial", "sede")


# ==============================
# TABLA CATEGORIA
# ==============================
class Categoria(models.Model):
    nombre = models.CharField(max_length=255)

    def __str__(self):
        return self.nombre


# ==============================
# TABLA PUBLICACION
# ==============================
class Publicacion(models.Model):
    ESTATUS_CHOICES = [
        ("publicada", "Publicada"),
        ("eliminada", "Eliminada"),
    ]

    autor = models.ForeignKey("Usuario", on_delete=models.DO_NOTHING)
    categoria = models.ForeignKey("Categoria", on_delete=models.DO_NOTHING)
    mundial = models.ForeignKey("Mundial", on_delete=models.DO_NOTHING, null=True, blank=True)
    titulo = models.CharField(max_length=255)
    descripcion = models.TextField()
    fecha_publicacion = models.DateTimeField(auto_now_add=True)
    fecha_edicion = models.DateTimeField(auto_now=True)
    estatus = models.CharField(max_length=10, choices=ESTATUS_CHOICES, default="publicada")

    def __str__(self):
        return self.titulo


# ==============================
# TABLA MULTIMEDIA
# ==============================
class Multimedia(models.Model):
    path = models.CharField(max_length=255)

    def __str__(self):
        return self.path


class MultimediaPublicacion(models.Model):
    ESTATUS_CHOICES = [
        ("agregada", "Agregada"),
        ("eliminada", "Eliminada"),
    ]

    multimedia = models.ForeignKey("Multimedia", on_delete=models.DO_NOTHING)
    publicacion = models.ForeignKey("Publicacion", on_delete=models.DO_NOTHING)
    estatus = models.CharField(max_length=10, choices=ESTATUS_CHOICES, default="agregada")


class MultimediaMundial(models.Model):
    multimedia = models.ForeignKey("Multimedia", on_delete=models.DO_NOTHING)
    mundial = models.ForeignKey("Mundial", on_delete=models.DO_NOTHING)


# ==============================
# TABLA COMENTARIO
# ==============================
class Comentario(models.Model):
    ESTATUS_CHOICES = [
        ("publicado", "Publicado"),
        ("eliminado", "Eliminado"),
    ]

    comentario = models.TextField()
    estatus = models.CharField(max_length=10, choices=ESTATUS_CHOICES, default="publicado")
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    fecha_edicion = models.DateTimeField(auto_now=True)
    usuario = models.ForeignKey("Usuario", on_delete=models.DO_NOTHING)
    publicacion = models.ForeignKey("Publicacion", on_delete=models.DO_NOTHING)

    def __str__(self):
        return f"Comentario de {self.usuario.nickname}"


# ==============================
# TABLA REACCION
# ==============================
class Reaccion(models.Model):
    usuario = models.ForeignKey("Usuario", on_delete=models.DO_NOTHING)
    publicacion = models.ForeignKey("Publicacion", on_delete=models.DO_NOTHING, null=True, blank=True)

    def __str__(self):
        return f"Reacción de {self.usuario.nickname} en {self.publicacion.titulo if self.publicacion else '---'}"

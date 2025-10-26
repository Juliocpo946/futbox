# Documentación de API - FutBOX

## Base URL

```
http://127.0.0.1:8000/api
```

## Autenticación

Todos los endpoints (excepto login y registro) requieren token JWT en el header:

```
Authorization: Bearer <token>
```

---

## Endpoints de Autenticación

### Registro de Usuario

```
POST /usuarios/registro/
```

Body:
```json
{
  "nombre": "Juan",
  "apellido_paterno": "Pérez",
  "apellido_materno": "García",
  "correo": "juan@example.com",
  "password": "password123",
  "nickname": "juanp",
  "fecha_nacimiento": "1995-05-15",
  "genero": "masculino"
}
```

Respuesta:
```json
{
  "id": 1,
  "nombre": "Juan",
  "nickname": "juanp",
  "correo": "juan@example.com",
  "rol": "usuario"
}
```

### Login

```
POST /usuarios/login/
```

Body:
```json
{
  "correo": "juan@example.com",
  "password": "password123"
}
```

Respuesta:
```json
{
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "access": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "usuario": {
    "id": 1,
    "nombre": "Juan",
    "nickname": "juanp",
    "rol": "usuario"
  }
}
```

### Logout

```
POST /usuarios/logout/
```

Respuesta:
```json
{
  "mensaje": "Cierre de sesión exitoso."
}
```

---

## Endpoints de Perfil

### Obtener Perfil Actual

```
GET /usuarios/perfil/
```

Respuesta:
```json
{
  "id": 1,
  "nombre": "Juan",
  "apellido_paterno": "Pérez",
  "correo": "juan@example.com",
  "nickname": "juanp",
  "rol": "usuario",
  "foto_perfil": "https://cloudinary.../imagen.jpg",
  "fecha_nacimiento": "1995-05-15",
  "genero": "masculino"
}
```

### Actualizar Perfil

```
PUT /usuarios/perfil/actualizar/
```

Body:
```json
{
  "nombre": "Juan Carlos",
  "nickname": "juanc",
  "password": "newpassword123"
}
```

### Actualizar Foto de Perfil

```
POST /usuarios/perfil/actualizar-foto/
Content-Type: multipart/form-data
```

Body (FormData):
```
file: [archivo de imagen]
```

### Eliminar Cuenta

```
DELETE /usuarios/perfil/eliminar/
```

Respuesta:
```json
{
  "mensaje": "Cuenta eliminada exitosamente."
}
```

### Perfil Público

```
GET /perfil/{nickname}/
```

Respuesta:
```json
{
  "id": 1,
  "nombre": "Juan",
  "nickname": "juanp",
  "foto_perfil": "https://cloudinary.../imagen.jpg",
  "fecha_registro": "2025-01-15T10:30:00Z"
}
```

---

## Endpoints de Publicaciones

### Listar Publicaciones Aprobadas

```
GET /publicaciones/
GET /publicaciones/?search=mundial
GET /publicaciones/?mundial=1
GET /publicaciones/?categoria=2
GET /publicaciones/?search=gol&mundial=1&categoria=2
```

Respuesta:
```json
[
  {
    "id": 1,
    "titulo": "Gol histórico de Maradona",
    "descripcion": "El mejor gol del mundial...",
    "fecha_publicacion": "2025-01-20T15:30:00Z",
    "autor": {
      "nombre": "Juan",
      "nickname": "juanp",
      "foto_perfil": "https://..."
    },
    "categoria": {
      "id": 1,
      "nombre": "Momentos Históricos"
    },
    "mundial": {
      "id": 1,
      "nombre": "México 1986",
      "año": 1986
    },
    "reacciones_count": 45,
    "comentarios_count": 12,
    "multimedia": [
      {
        "id": 1,
        "path": "https://cloudinary.../video.mp4",
        "media_type": "video"
      }
    ],
    "estatus": "aprobada"
  }
]
```

### Obtener Detalle de Publicación

```
GET /publicaciones/{id}/
```

### Crear Publicación

```
POST /publicaciones/
```

Body:
```json
{
  "titulo": "Título de la publicación",
  "descripcion": "Descripción detallada...",
  "categoria": 1,
  "mundial": 2
}
```

Respuesta:
```json
{
  "id": 5,
  "titulo": "Título de la publicación",
  "estatus": "pendiente"
}
```

### Actualizar Publicación

```
PUT /publicaciones/{id}/
```

Body:
```json
{
  "titulo": "Título actualizado",
  "descripcion": "Nueva descripción",
  "categoria": 2
}
```

### Eliminar Publicación

```
DELETE /publicaciones/{id}/
```

### Subir Multimedia a Publicación

```
POST /publicaciones/{id}/multimedia/
Content-Type: multipart/form-data
```

Body (FormData):
```
files: [archivo1, archivo2, archivo3]
```

Respuesta:
```json
[
  {
    "id": 10,
    "path": "https://cloudinary.../imagen.jpg",
    "media_type": "image"
  },
  {
    "id": 11,
    "path": "https://cloudinary.../video.mp4",
    "media_type": "video"
  }
]
```

### Mis Publicaciones

```
GET /usuarios/mis-publicaciones/
GET /usuarios/mis-publicaciones/?estatus=pendiente
```

### Publicaciones de Usuario Público

```
GET /perfil/publicaciones/{user_id}/
```

---

## Endpoints de Comentarios

### Listar Comentarios de Publicación

```
GET /publicaciones/{id}/comentarios/
```

Respuesta:
```json
[
  {
    "id": 1,
    "comentario": "Excelente publicación!",
    "fecha_creacion": "2025-01-21T10:15:00Z",
    "usuario": {
      "nombre": "María",
      "nickname": "mariac",
      "foto_perfil": "https://..."
    }
  }
]
```

### Crear Comentario

```
POST /publicaciones/{id}/comentarios/
```

Body:
```json
{
  "comentario": "Me encantó este momento histórico"
}
```

### Actualizar Comentario

```
PUT /publicaciones/{publicacion_id}/comentarios/{comentario_id}/
```

Body:
```json
{
  "comentario": "Comentario actualizado"
}
```

### Eliminar Comentario

```
DELETE /publicaciones/{publicacion_id}/comentarios/{comentario_id}/
```

---

## Endpoints de Reacciones

### Reaccionar a Publicación

```
POST /publicaciones/{id}/reaccionar/
```

Respuesta (crear):
```json
{
  "status": "reaccion_creada"
}
```

Respuesta (eliminar):
```json
{
  "status": "reaccion_eliminada"
}
```

---

## Endpoints Públicos

### Listar Categorías

```
GET /publicaciones/categorias/
```

Respuesta:
```json
[
  {
    "id": 1,
    "nombre": "Momentos Históricos"
  },
  {
    "id": 2,
    "nombre": "Análisis Táctico"
  }
]
```

### Listar Mundiales

```
GET /publicaciones/mundiales/
```

Respuesta:
```json
[
  {
    "id": 1,
    "nombre": "México 1986",
    "año": 1986,
    "descripcion": "El mundial donde...",
    "sedes": [
      {
        "id": 1,
        "pais": "México"
      }
    ],
    "multimedia": [
      {
        "id": 1,
        "path": "https://cloudinary.../mundial.jpg",
        "media_type": "image"
      }
    ]
  }
]
```

---

## Endpoints de Administración

Requieren rol: `admin`

### Listar Publicaciones Pendientes

```
GET /admin/publicaciones/pendientes/
```

### Aprobar Publicación

```
PUT /admin/publicaciones/{id}/aprobar/
```

### Rechazar Publicación

```
PUT /admin/publicaciones/{id}/rechazar/
```

### Listar Usuarios

```
GET /admin/usuarios/
```

### Cambiar Rol de Usuario

```
PUT /admin/usuarios/{id}/
```

Body:
```json
{
  "rol": "admin"
}
```

### Gestionar Países

```
GET /admin/paises/
POST /admin/paises/
PUT /admin/paises/{id}/
DELETE /admin/paises/{id}/
```

Body (POST/PUT):
```json
{
  "pais": "Argentina"
}
```

### Gestionar Mundiales

```
GET /admin/mundiales/
POST /admin/mundiales/
POST /admin/mundiales/{id}/
DELETE /admin/mundiales/{id}/
```

Body (POST) - multipart/form-data:
```
nombre: Mundial Sudáfrica
año: 2010
descripcion: Descripción del mundial
sedes: [1, 2, 3]
imagenes: [archivo1, archivo2]
```

### Gestionar Categorías

```
GET /admin/categorias/
POST /admin/categorias/
PUT /admin/categorias/{id}/
DELETE /admin/categorias/{id}/
```

Body (POST/PUT):
```json
{
  "nombre": "Análisis Táctico"
}
```

### Estadísticas Admin

```
GET /admin/stats/
```

Respuesta:
```json
{
  "publicaciones_pendientes": 5
}
```

### Reportes del Sistema

```
GET /reportes/
```

Respuesta:
```json
{
  "publicaciones_mas_comentadas": [
    {
      "id": 1,
      "titulo": "Gol de Maradona",
      "num_comentarios": 45
    }
  ],
  "usuarios_mas_activos": [
    {
      "nickname": "juanp",
      "num_publicaciones": 10,
      "num_comentarios": 25,
      "actividad_total": 35
    }
  ],
  "categorias_con_mas_contenido": [
    {
      "nombre": "Momentos Históricos",
      "num_publicaciones": 50
    }
  ],
  "mundiales_con_mas_interaccion": [
    {
      "año": 1986,
      "num_publicaciones": 30,
      "num_reacciones": 120,
      "interaccion_total": 150
    }
  ]
}
```

---

## Códigos de Estado HTTP

- `200 OK`: Petición exitosa
- `201 Created`: Recurso creado exitosamente
- `204 No Content`: Eliminación exitosa
- `400 Bad Request`: Datos inválidos
- `401 Unauthorized`: Token inválido o expirado
- `403 Forbidden`: Sin permisos suficientes
- `404 Not Found`: Recurso no encontrado
- `500 Internal Server Error`: Error del servidor

---

## Notas Importantes

### Filtros Múltiples

Los parámetros de búsqueda se pueden combinar:

```
GET /publicaciones/?search=gol&mundial=1&categoria=2
```

### Soft Delete

Las eliminaciones cambian el estado a "eliminada" sin borrar físicamente el registro.

### Validaciones

- Email único por usuario
- Nickname único por usuario
- Contraseñas mínimo 8 caracteres
- Publicaciones requieren categoría
- Solo el autor puede editar/eliminar sus publicaciones
- Solo el autor puede editar/eliminar sus comentarios
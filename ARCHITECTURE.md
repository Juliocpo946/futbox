# Arquitectura del Sistema FutBOX

## Visión General

FutBOX implementa una arquitectura en capas con separación clara de responsabilidades:

- Capa de Presentación (Templates + JavaScript)
- Capa de API (Django REST Framework)
- Capa de Servicios (Lógica de Negocio)
- Capa de Repositorios (Acceso a Datos)
- Capa de Persistencia (MySQL)

## Estructura de Carpetas

```
mundial_fifa/
├── mundial_fifa/          # Configuración del proyecto Django
│   ├── settings.py
│   ├── urls.py
│   └── wsgi.py
├── pw2/                   # Aplicación principal
│   ├── api/              # Endpoints REST
│   │   ├── views/        # Controladores API separados por dominio
│   │   ├── serializers.py
│   │   └── urls.py
│   ├── repositories/     # Capa de acceso a datos
│   ├── services/         # Lógica de negocio
│   ├── models.py         # Modelos de base de datos
│   ├── views.py          # Vistas Django tradicionales
│   ├── static/           # Recursos estáticos
│   │   └── pw2/
│   │       ├── css/
│   │       ├── js/
│   │       │   ├── api/
│   │       │   ├── components/
│   │       │   ├── pages/
│   │       │   └── utils/
│   │       └── images/
│   └── templates/        # Plantillas HTML
└── requirements.txt
```

## Patrones de Diseño Aplicados

### Repository Pattern

Cada entidad tiene su repositorio dedicado que encapsula las operaciones de base de datos.

Ejemplo en publicacion_repository.py:

```python
class PublicacionRepository:
    def get_all_aprobadas(self, search_query=None, mundial_id=None, categoria_id=None):
        queryset = Publicacion.objects.filter(estatus='aprobada')
        if search_query:
            queryset = queryset.filter(Q(titulo__icontains=search_query))
        return queryset.order_by('-fecha_publicacion')
```

### Service Layer Pattern

Los servicios contienen la lógica de negocio y coordinan operaciones entre repositorios.

Ejemplo en auth_service.py:

```python
class AuthService:
    def __init__(self):
        self.usuario_repo = UsuarioRepository()

    def register_user(self, data):
        if self.usuario_repo.exists_by_email(data['correo']):
            raise ValueError("El correo electronico ya esta en uso.")
        return self.usuario_repo.create(data)
```

### API Views Pattern

Las vistas de API delegan toda la lógica a los servicios.

Ejemplo en publicaciones.py:

```python
class PublicacionesView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        service = PublicacionService()
        publicaciones = service.repo.get_all_aprobadas()
        serializer = PublicacionSerializer(publicaciones, many=True)
        return Response(serializer.data)
```

## Flujo de una Petición API

1. Cliente JavaScript realiza fetch a endpoint
2. Django REST Framework enruta a la vista correspondiente
3. Vista valida permisos y serializa datos de entrada
4. Vista invoca método del servicio apropiado
5. Servicio ejecuta lógica de negocio
6. Servicio utiliza repositorio para acceso a datos
7. Repositorio ejecuta consulta ORM sobre la base de datos
8. Resultado se propaga hacia arriba por las capas
9. Vista serializa respuesta y la devuelve como JSON
10. Cliente JavaScript procesa la respuesta

## Autenticación y Autorización

### Sistema de Tokens JWT

El sistema utiliza Simple JWT para autenticación basada en tokens.

Configuración en settings.py:

```python
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=60),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=1),
}
```

Flujo de autenticación en auth.py (API):

```python
class LoginView(APIView):
    permission_classes = [AllowAny]
    
    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        if serializer.is_valid():
            service = AuthService()
            tokens = service.login_user(request, serializer.validated_data)
            return Response(tokens, status=status.HTTP_200_OK)
```

Cliente almacena token en localStorage y lo envía en cada petición:

```javascript
const token = window.auth.getAuthToken();
if (token) {
    headers['Authorization'] = `Bearer ${token}`;
}
```

### Control de Acceso por Roles

Implementación de permisos personalizados en permissions.py:

```python
class IsAdminUser(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.rol == 'admin'
```

Uso en vistas:

```python
class AdminUsuariosView(APIView):
    permission_classes = [IsAdminUser]
```

## Gestión de Multimedia

### Integración con Cloudinary

Configuración en settings.py:

```python
cloudinary.config(
    cloud_name="doeofn1nd",
    api_key="357696619194841",
    api_secret="5YtB5DwBMMnESfwzNZMba4Ef_Y0"
)
```

Helper de subida en cloudinary_helper.py:

```python
def upload_image(file):
    upload_result = cloudinary.uploader.upload(
        file,
        folder="futbox_multimedia",
        resource_type="auto"
    )
    multimedia_obj = Multimedia.objects.create(
        path=upload_result['secure_url'],
        media_type=media_type
    )
    return multimedia_obj
```

### Relaciones Many-to-Many

Las publicaciones y mundiales pueden tener múltiples archivos multimedia.

Modelo intermedio MultimediaPublicacion en models.py:

```python
class MultimediaPublicacion(models.Model):
    multimedia = models.ForeignKey("Multimedia", on_delete=models.DO_NOTHING)
    publicacion = models.ForeignKey("Publicacion", on_delete=models.DO_NOTHING)
    estatus = models.CharField(max_length=10, default="agregada")
```

Servicio de asociación en multimedia_service.py:

```python
def subir_y_asociar_imagen(self, file, publicacion):
    multimedia_obj = upload_image(file)
    self.repo.associate_with_publicacion(multimedia_obj, publicacion)
    return multimedia_obj
```

## Manejo de Errores

### Logging Centralizado

Sistema de logs críticos en logger.py:

```python
logging.basicConfig(
    level=logging.ERROR,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(os.path.join(log_dir, 'futbox_critical.log'))
    ]
)

def log_critical_error(message, exception=None):
    if exception:
        logger.critical(f"{message}: {str(exception)}")
```

### Manejo de Excepciones en API

Patrón consistente en todas las vistas:

```python
try:
    resultado = service.metodo()
    return Response(resultado, status=status.HTTP_200_OK)
except ValueError as e:
    return Response({'error': str(e)}, status=status.HTTP_404_NOT_FOUND)
except Exception as e:
    log_critical_error("Error inesperado", e)
    return Response({'error': 'Error en el servidor'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
```

## Base de Datos

### Modelo de Usuario Personalizado

Extensión de AbstractBaseUser en models.py:

```python
class Usuario(AbstractBaseUser, PermissionsMixin):
    correo = models.EmailField(unique=True)
    nickname = models.CharField(max_length=255, unique=True)
    rol = models.CharField(max_length=50, default='usuario')
    
    USERNAME_FIELD = 'correo'
    REQUIRED_FIELDS = ['nombre', 'nickname']
```

### Sistema de Estados

Publicaciones y comentarios utilizan campos de estado para workflows de aprobación:

```python
ESTATUS_CHOICES = [
    ("pendiente", "Pendiente"),
    ("aprobada", "Aprobada"),
    ("rechazada", "Rechazada"),
    ("eliminada", "Eliminada")
]
```

## Frontend

### Organización Modular JavaScript

Separación por responsabilidad:

- api/: Comunicación con backend
- components/: Elementos reutilizables de UI
- pages/: Lógica específica de cada página
- utils/: Funciones auxiliares compartidas

### Sistema de Componentes

Componente de filtros reutilizable en filtros.js:

```javascript
class FiltrosPublicaciones {
    constructor(config) {
        this.onFilterChange = config.onFilterChange;
        this.init();
    }

    aplicarFiltros() {
        if (this.onFilterChange) {
            this.onFilterChange(this.getEndpointConFiltros());
        }
    }
}
```

### Gestión de Estado del Cliente

Estado de autenticación persistente:

```javascript
function saveAuthData(token, userData) {
    localStorage.setItem('accessToken', token);
    localStorage.setItem('userData', JSON.stringify(userData));
}

function getUserData() {
    const userData = localStorage.getItem('userData');
    return userData ? JSON.parse(userData) : null;
}
```

## Optimizaciones Implementadas

### Prefetch y Select Related

Reducción de consultas N+1:

```python
def get_by_id(self, publicacion_id):
    return Publicacion.objects.select_related('autor', 'categoria', 'mundial').prefetch_related('multimediapublicacion_set__multimedia').get(id=publicacion_id)
```

### Caching en Cliente

Almacenamiento temporal de datos para evitar peticiones redundantes:

```javascript
let cachedPublications = [];

async function cargarPublicaciones(endpoint) {
    const publicaciones = await window.api.fetchAPI(endpoint);
    cachedPublications = publicaciones;
    renderPublicaciones(publicaciones);
}
```

### Paginación Implícita

Limitación de resultados en consultas:

```python
def get_all_aprobadas(self):
    return queryset.order_by('-fecha_publicacion')[:50]
```

## Seguridad

### Validación de Entrada

Validación en serializers antes de procesar datos:

```python
class RegisterSerializer(serializers.ModelSerializer):
    class Meta:
        extra_kwargs = {
            'password': {'write_only': True},
        }
```

### Protección CSRF

Configuración de orígenes confiables:

```python
CSRF_TRUSTED_ORIGINS = [
    'http://localhost:8000',
    'http://127.0.0.1:8000',
]
```

### Sanitización de Respuestas

Los serializers garantizan que solo se expongan campos autorizados:

```python
class AuthorSerializer(BaseUsuarioSerializer):
    class Meta:
        model = Usuario
        fields = ['nombre', 'nickname', 'foto_perfil']
```

## Testing y Debugging

### Endpoints de Prueba

Durante desarrollo, se validan endpoints con herramientas como Postman o Thunder Client.

### Logs de Depuración

Sistema de logging solo para errores críticos. No se loguean operaciones exitosas para mantener archivos limpios.

Formato estándar:

```
[YYYY-MM-DD HH:MM:SS] [MODULO] [ERROR] Descripción breve
```

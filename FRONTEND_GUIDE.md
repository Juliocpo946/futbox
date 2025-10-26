# Guía del Frontend - FutBOX

## Organización de Archivos JavaScript

```

static/pw2/js/
├── api/
│   ├── api.js           \# Cliente HTTP centralizado
│   └── auth.js          \# Gestión de autenticación
├── components/
│   ├── barraNavegacion.js \# Barra superior (con polling para badge admin)
│   ├── sidebar.js
│   ├── MenuPerfil.js
│   └── Carrusel.js
├── pages/
│   ├── index.js         \# Página principal
│   ├── comunidad.js     \# Lista de publicaciones (con polling)
│   ├── detallePublicacion.js \# Detalle (con polling de comentarios)
│   ├── crearPublicacion.js
│   ├── login.js
│   ├── miPerfil.js      \# Perfil (con polling de publicaciones)
│   ├── perfilPublico.js \# Perfil público (con polling)
│   └── editarPerfil.js
├── utils/
│   ├── filtros.js       \# Sistema de filtros reutilizable
│   ├── publicaciones.js \# Generación de cards
│   ├── comentarios.js   \# Gestión de comentarios
│   └── lightbox.js      \# Modal de imágenes
└── admin/
├── adminPanel.js
├── adminPublicaciones.js
├── adminUsuarios.js
└── ... \# Otros archivos de administración

````

---

## Cliente HTTP (api.js)

### Configuración Base

```javascript
const BASE_URL = '[http://127.0.0.1:8000/api](http://127.0.0.1:8000/api)';

async function fetchAPI(endpoint, options = {}) {
    const url = `${BASE_URL}${endpoint}`;
    // Headers por defecto
    const defaultHeaders = {};
    // No establecer Content-Type si es FormData (el navegador lo hace)
    if (!(options.body instanceof FormData)) {
        defaultHeaders['Content-Type'] = 'application/json';
    }
    // Combinar headers por defecto con los proporcionados
    const headers = { ...defaultHeaders, ...options.headers };

    // Añadir token de autenticación si existe
    const token = window.auth.getAuthToken();
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    // Configuración final de la petición
    const config = { ...options, headers };

    try {
        const response = await fetch(url, config);

        // Manejo de errores de autenticación/autorización
        if (response.status === 401 || response.status === 403) {
            window.auth.clearAuthData(); // Limpiar datos de sesión local
            if (window.location.pathname !== '/login/') {
                 window.location.replace('/login/'); // Redirigir a login
            }
            throw new Error('Sesión expirada o sin permisos');
        }

        // Manejo de otros errores HTTP
        if (!response.ok) {
            let errorData;
            try {
                 errorData = await response.json(); // Intentar obtener detalles del error
            } catch (e) {
                 errorData = { error: `Error HTTP ${response.status}: ${response.statusText}` };
            }
            // Construir mensaje de error
            let errorMessage = errorData?.error || errorData?.detail || JSON.stringify(errorData);
            throw new Error(errorMessage);
        }

        // Manejo de respuesta vacía (ej. DELETE exitoso)
        if (response.status === 204) {
            return null;
        }

        // Parsear respuesta (JSON o texto)
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
            return await response.json();
        } else {
            return await response.text();
        }

    } catch (error) {
        console.error('Error en la petición a la API:', error);
        throw error; // Re-lanzar el error para que sea manejado por quien llamó a fetchAPI
    }
}
window.api = { fetchAPI }; // Exponer la función globalmente
````

### Uso Básico

```javascript
// GET simple
const publicaciones = await window.api.fetchAPI('/publicaciones/');

// POST con cuerpo JSON
await window.api.fetchAPI('/publicaciones/', {
    method: 'POST',
    body: JSON.stringify({ titulo: 'Título', descripcion: 'Desc' })
});

// POST con FormData (para subida de archivos)
const formData = new FormData();
formData.append('file', fileInput.files[0]);
await window.api.fetchAPI('/usuarios/perfil/actualizar-foto/', {
    method: 'POST',
    body: formData
    // No es necesario 'headers': {} aquí, fetch lo maneja
});
```

-----

## Sistema de Autenticación (auth.js)

### Almacenamiento de Credenciales

Utiliza `localStorage` para persistir la sesión entre cierres del navegador.

```javascript
function saveAuthData(token, userData) {
    localStorage.setItem('accessToken', token); // Guarda el token JWT
    localStorage.setItem('userData', JSON.stringify(userData)); // Guarda info básica del usuario
}

function getAuthToken() {
    return localStorage.getItem('accessToken');
}

function getUserData() {
    const userData = localStorage.getItem('userData');
    return userData ? JSON.parse(userData) : null;
}

function clearAuthData() {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('userData');
}
```

### Protección de Rutas

Verifica si el usuario está logueado al cargar una página protegida.

```javascript
function isLoggedIn() {
    const token = getAuthToken();
    const userData = getUserData();
    return !!(token && userData); // Devuelve true si ambos existen
}

function protectRoute() {
    if (!isLoggedIn()) {
        clearAuthData(); // Limpia por si acaso
        window.location.replace('/login/'); // Redirige a la página de login
    }
}

// Ejemplo de uso en una página protegida (ej. miPerfil.js)
document.addEventListener('DOMContentLoaded', () => {
    window.auth.protectRoute();
    // ... resto del código de la página ...
});
```

### Verificación de Permisos (Rol Admin)

```javascript
function isAdmin() {
    const userData = getUserData();
    return userData && userData.rol === 'admin';
}

// Ejemplo de uso
if (window.auth.isAdmin()) {
    // Mostrar u ocultar elementos específicos para administradores
    actualizarBadgeAdmin(); // En barraNavegacion.js
}
```

### Logout

```javascript
async function logout() {
    clearAuthData(); // Limpia localStorage
    try {
        // Intenta invalidar el token en el backend (opcional, depende del backend)
        await window.api.fetchAPI('/usuarios/logout/', { method: 'POST' });
    } catch (error) {
        console.error("Error al cerrar sesión en servidor:", error); // No bloquea la redirección
    }
    window.location.replace('/login/'); // Redirige a login
}
window.auth = { /* ... exportar funciones ... */ };
```

-----

## Flujo de Login y Registro (login.js)

### Login

Maneja el envío del formulario de login, llama a la API y guarda los datos si es exitoso.

```javascript
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearError(); // Limpia mensajes de error previos
    const data = {
        correo: loginForm.email.value,
        password: loginForm.password.value,
    };
    try {
        const result = await window.api.fetchAPI('/usuarios/login/', {
            method: 'POST',
            body: JSON.stringify(data),
        });
        // Si la API responde OK, guarda token y datos de usuario
        window.auth.saveAuthData(result.access, result.usuario);
        window.location.replace('/'); // Redirige a la página principal
    } catch (error) {
        displayError('Error al iniciar sesión: ' + error.message); // Muestra error
    }
});
```

### Registro

Maneja el envío del formulario de registro, llama a la API y, si tiene éxito, realiza un login automático.

```javascript
registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearError();
    const formData = new FormData(registerForm);
    const data = Object.fromEntries(formData.entries());

    // Validaciones básicas de frontend (ej. contraseña, edad)
    // ...

    try {
        // 1. Llama a la API de registro
        await window.api.fetchAPI('/usuarios/registro/', {
            method: 'POST',
            body: JSON.stringify(data),
        });

        // 2. Si el registro fue exitoso, intenta hacer login automáticamente
        const loginData = { correo: data.correo, password: data.password };
        const result = await window.api.fetchAPI('/usuarios/login/', {
            method: 'POST',
            body: JSON.stringify(loginData),
        });

        // 3. Guarda los datos de sesión y redirige
        window.auth.saveAuthData(result.access, result.usuario);
        window.location.replace('/');
    } catch (error) {
        displayError('Error en el registro: ' + error.message);
    }
});
```

-----

## Sistema de Filtros (filtros.js)

### Clase `FiltrosPublicaciones`

Clase reutilizable para manejar la búsqueda por texto, selección de mundial y categoría.

```javascript
class FiltrosPublicaciones {
    constructor(config) {
        // Elementos del DOM (IDs configurables)
        this.searchForm = document.getElementById(config.searchFormId || 'search-form-nav');
        this.searchInput = document.getElementById(config.searchInputId || 'search-input-nav');
        this.mundialSelect = document.getElementById(config.mundialSelectId || 'mundial-filter-nav');
        this.tituloSeccion = document.getElementById(config.tituloSeccionId); // Opcional, para mostrar qué se está filtrando
        this.onFilterChange = config.onFilterChange; // Callback a ejecutar cuando cambian los filtros

        // Estado interno de los filtros
        this.currentSearchQuery = '';
        this.currentMundialId = '';
        this.currentCategoriaId = '';
        this.currentCategoriaNombre = ''; // Para mostrar en el título

        this.mundialesCargados = false; // Flag para evitar recargar el select

        this.init(); // Inicializar al crear la instancia
    }

    init() {
        this.cargarFiltrosDesdeURL(); // Lee parámetros de la URL actual
        this.cargarMundialesSelect(); // Llena el select de mundiales desde la API
        this.setupEventListeners(); // Configura listeners para input, select y eventos personalizados
        // Si hay categoría en URL, busca su nombre para mostrarlo
        if (this.currentCategoriaId) {
             this.cargarNombreCategoria().then(() => this.actualizarTitulo());
        } else {
            this.actualizarTitulo(); // Actualiza título inicial
        }
    }

    async cargarMundialesSelect() {
        if (!this.mundialSelect || this.mundialesCargados) return;
        try {
            const mundiales = await window.api.fetchAPI('/publicaciones/mundiales/');
            const tieneOpciones = this.mundialSelect.options.length > 1; // Ya tiene "Todos"
            if (tieneOpciones && this.mundialSelect.querySelector('option[value="none"]')) {
                 this.mundialesCargados = true; return; // Ya cargado
            }

            // Añadir opción "Sin Mundiales"
            const sinMundialOption = document.createElement('option');
            sinMundialOption.value = "none";
            sinMundialOption.textContent = "Sin Mundiales";
            this.mundialSelect.appendChild(sinMundialOption);

            // Añadir mundiales desde la API
            mundiales.sort((a, b) => b.año - a.año).forEach(m => { /* ... crear <option> ... */ });
            // Seleccionar valor actual si viene de URL
            if (this.currentMundialId) this.mundialSelect.value = this.currentMundialId;
            this.mundialesCargados = true;
        } catch (error) { /* Manejo de error */ }
    }

    setupEventListeners() {
        // Listener para el formulario de búsqueda
        if (this.searchForm && this.searchInput) {
            this.searchForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.currentSearchQuery = this.searchInput.value.trim();
                // Limpiar otros filtros al buscar
                this.currentCategoriaId = ''; this.currentCategoriaNombre = '';
                this.aplicarFiltros(); // Llama al callback onFilterChange
            });
        }
        // Listener para el select de mundial
        if (this.mundialSelect) {
            this.mundialSelect.addEventListener('change', (e) => {
                this.currentMundialId = e.target.value;
                this.aplicarFiltros();
            });
        }
        // Listener para evento personalizado (ej. click en categoría en sidebar)
        document.addEventListener('filterByCategory', (event) => {
            this.currentCategoriaId = event.detail.categoryId;
            this.currentCategoriaNombre = event.detail.categoryName;
            // Limpiar otros filtros
            this.currentSearchQuery = ''; this.currentMundialId = '';
            if (this.searchInput) this.searchInput.value = '';
            if (this.mundialSelect) this.mundialSelect.value = '';
            this.aplicarFiltros();
        });
    }

    cargarFiltrosDesdeURL() {
        const urlParams = new URLSearchParams(window.location.search);
        this.currentCategoriaId = urlParams.get('categoria') || '';
        this.currentMundialId = urlParams.get('mundial') || '';
        this.currentSearchQuery = urlParams.get('search') || '';
        // Sincronizar UI (input de búsqueda) con valores de URL
        if (this.currentSearchQuery && this.searchInput) {
            this.searchInput.value = this.currentSearchQuery;
        }
        // El select de mundial se sincroniza en cargarMundialesSelect
    }

    async cargarNombreCategoria() {
        // Llama a API /categorias/ para obtener el nombre si solo tenemos el ID
        // ... (código existente) ...
    }

    aplicarFiltros() {
        this.actualizarTitulo(); // Actualiza H1 si existe
        if (this.onFilterChange) {
            // Llama a la función proporcionada (ej. cargarPublicaciones)
            // pasándole el endpoint con los parámetros de filtro actuales
            this.onFilterChange(this.getEndpointConFiltros());
        }
    }

    getEndpointConFiltros() {
        // Construye la URL con los parámetros de filtro activos
        let endpoint = '/publicaciones/?';
        const params = [];
        if (this.currentSearchQuery) params.push(`search=${encodeURIComponent(this.currentSearchQuery)}`);
        if (this.currentMundialId) params.push(`mundial=${this.currentMundialId}`); // Incluye 'none'
        if (this.currentCategoriaId) params.push(`categoria=${this.currentCategoriaId}`);
        return endpoint + params.join('&');
    }

    actualizarTitulo() {
        // Actualiza el H1 de la sección si se proporcionó su ID
        // ... (código existente) ...
    }
    // ... otros métodos ...
}
window.FiltrosPublicaciones = FiltrosPublicaciones; // Exponer globalmente
```

### Uso en Página (ej. `comunidad.js`)

Se crea una instancia de `FiltrosPublicaciones` y se le pasa una función (`cargarPublicaciones`) que se ejecutará cada vez que cambie un filtro.

```javascript
// En comunidad.js
document.addEventListener('DOMContentLoaded', async () => {
    // ... setup inicial ...
    const container = document.getElementById('publicaciones-container');

    const filtros = new window.FiltrosPublicaciones({
        tituloSeccionId: 'titulo-seccion', // ID del H1 a actualizar
        onFilterChange: (endpoint) => { // Función que se llama al cambiar filtros
            stopPolling(); // Detener polling si está activo
            cargarPublicaciones(endpoint, true); // Recargar publicaciones con el nuevo endpoint
        }
    });

    async function cargarPublicaciones(endpoint, isFilterChange = false) {
        // ... lógica de fetch y renderizado ...
        // ... manejo de caché y polling (ver sección Polling) ...
    }
    // ... resto del código (listeners, polling, etc.) ...
    filtros.aplicarFiltros(); // Carga inicial basada en URL/defaults
});
```

-----

## Renderizado de Publicaciones (publicaciones.js)

### Generar Card de Publicación (`crearCardPublicacion`)

Función utilitaria para generar el HTML de una card de publicación de forma consistente.

```javascript
// En utils/publicaciones.js

// Funciones auxiliares para generar partes del HTML
function generarMetaHTML(pub) { /* ... */ }
function generarProfilePicHTML(usuario, size = 'normal') { /* ... */ }
function generarMediaHTML(multimedia) { /* ... retorna { html, indicator } ... */ }

function crearCardPublicacion(pub, pubIndex, incluirEstatus = false) {
    const fecha = new Date(pub.fecha_publicacion).toLocaleDateString(/* ... */);
    const profilePicHTML = generarProfilePicHTML(pub.autor);
    const { html: mediaHTML, indicator: mediaIndicatorHTML } = generarMediaHTML(pub.multimedia);
    const metaHTML = generarMetaHTML(pub);

    const card = document.createElement('div');
    card.className = 'publicacion-card';
    card.dataset.id = pub.id;
    card.dataset.index = pubIndex; // Índice en el array de caché (útil para lightbox/acciones)

    // Lógica condicional para estatus, forms de comentario, etc.
    const estatusHTML = incluirEstatus ? `<span>...</span>` : '';
    const comentariosPreviewHTML = (pub.estatus === 'aprobada' || !incluirEstatus) ? `<div class="card-comentarios-preview" data-pub-id="${pub.id}"><p>Cargando...</p></div>` : '';
    const comentarioFormHTML = (pub.estatus === 'aprobada' || !incluirEstatus) ? `<form>...</form>` : '';
    const onclickBody = (pub.estatus === 'aprobada' || !incluirEstatus) ? `onclick="window.location.href='/publicaciones/${pub.id}/'"` : '';

    card.innerHTML = `
        <div class="publicacion-media">
            ${mediaHTML}
            ${mediaIndicatorHTML}
        </div>
        <div class="publicacion-info">
            <div class="publicacion-body">
                <div class="publicacion-header"> ${profilePicHTML} /* ... */ </div>
                <div ${onclickBody} style="${/* cursor pointer si es clickeable */ ''}">
                    <h3>${pub.titulo}</h3>
                    ${metaHTML}
                    <p>${pub.descripcion}</p>
                </div>
                ${comentariosPreviewHTML}
            </div>
            <div class="publicacion-footer">
                 <div class="publicacion-stats"> /* ... reacciones, comentarios, estatus ... */ </div>
                 ${comentarioFormHTML}
            </div>
        </div>
    `;

    return card;
}
window.publicacionesUtils = { crearCardPublicacion, /* ... otras ... */ };
```

-----

## Gestión de Comentarios (comentarios.js)

### Cargar y Renderizar Comentarios (Preview y Detalle)

Funciones para obtener comentarios de la API y mostrarlos, ya sea en la card (preview) o en la página de detalle.

```javascript
// En utils/comentarios.js

async function cargarYRenderizarComentariosPreview(publicacionId) {
    const previewContainer = document.querySelector(`.card-comentarios-preview[data-pub-id="${publicacionId}"]`);
    if (!previewContainer) return;
    try {
        const comentarios = await window.api.fetchAPI(`/publicaciones/${publicacionId}/comentarios/`);
        const ultimosComentarios = comentarios.slice(-2); // Mostrar solo los últimos
        if (ultimosComentarios.length === 0) { /* ... mensaje "sin comentarios" ... */ return; }
        // Generar HTML para los últimos comentarios y actualizar previewContainer.innerHTML
        // ...
    } catch (error) { /* ... mostrar error en previewContainer ... */ }
}

// Nota: La carga y renderizado en detallePublicacion.js es similar pero maneja la lista completa.
```

### Manejar Envío de Comentario (`manejarComentario`)

Se llama desde el listener del `submit` del formulario de comentario.

```javascript
// En utils/comentarios.js

async function manejarComentario(e, publicacionId, card, cachedPublications, publicationIndex) {
    e.preventDefault();
    const textarea = e.target.querySelector('textarea');
    const texto = textarea.value.trim();
    if (!texto) return;
    const button = e.target.querySelector('button');
    try {
        if (button) button.disabled = true; // Deshabilitar botón
        // Llamar a la API para crear el comentario
        await window.api.fetchAPI(`/publicaciones/${publicacionId}/comentarios/`, {
            method: 'POST', body: JSON.stringify({ comentario: texto }),
        });
        textarea.value = ''; // Limpiar textarea

        // Actualización optimista del contador
        const commentInfo = card.querySelector('.comentarios-info span');
        if (commentInfo) {
             let currentCount = parseInt(commentInfo.textContent, 10);
             commentInfo.textContent = currentCount + 1;
             // Actualizar caché si se usa
             if (cachedPublications && publicationIndex !== undefined) {
                 cachedPublications[publicationIndex].comentarios_count++;
             }
        }
        // Recargar el preview para mostrar el nuevo comentario (eventualmente)
        cargarYRenderizarComentariosPreview(publicacionId);
    } catch (error) {
        alert('Error al publicar comentario.'); // Mostrar error
        // Podría revertirse el contador aquí si se desea
    } finally {
        if (button) button.disabled = false; // Rehabilitar botón
    }
}
window.comentariosUtils = { cargarYRenderizarComentariosPreview, manejarComentario, manejarReaccion };
```

### Manejar Reacción (`manejarReaccion`)

Se llama desde el listener del `click` en la sección de reacciones.

```javascript
// En utils/comentarios.js (o podría estar en publicaciones.js)

async function manejarReaccion(publicacionId, card, cachedPublications, publicationIndex) {
    try {
        // Llama a la API que alterna la reacción (like/unlike)
        const resultado = await window.api.fetchAPI(`/publicaciones/${publicacionId}/reaccionar/`, { method: 'POST' });
        const countSpan = card.querySelector('.reaccion-count');
        const heartIcon = card.querySelector('.reacciones-info .fa-heart'); // Asumiendo FontAwesome

        if (countSpan) {
            let currentCount = parseInt(countSpan.textContent, 10);
            // Actualizar contador y UI basado en la respuesta del backend
            if (resultado.status === 'reaccion_creada') {
                 countSpan.textContent = currentCount + 1;
                 // Opcional: cambiar estilo del icono a "reaccionado"
                 if (heartIcon) heartIcon.classList.add('reaccionado'); // Necesita CSS
            } else if (resultado.status === 'reaccion_eliminada') {
                 countSpan.textContent = Math.max(0, currentCount - 1);
                 if (heartIcon) heartIcon.classList.remove('reaccionado');
            }
            // Actualizar caché si se usa
            if (cachedPublications && publicationIndex !== undefined) {
                 cachedPublications[publicationIndex].reacciones_count = parseInt(countSpan.textContent);
                 // Podrías añadir un flag 'usuario_reacciono' al caché también
            }
        }
    } catch (error) { alert('Error al procesar reacción.'); }
}
```

-----

## Lightbox de Imágenes (lightbox.js)

### Clase `MediaLightbox`

Clase para manejar un modal que muestra imágenes y videos en un carrusel.

```javascript
// En utils/lightbox.js
class MediaLightbox {
    constructor(lightboxId) {
        this.lightbox = document.getElementById(lightboxId);
        this.inner = this.lightbox?.querySelector('.media-lightbox-carousel-inner');
        this.closeBtn = this.lightbox?.querySelector('.lightbox-close');
        this.prevBtn = this.lightbox?.querySelector('.media-lightbox-control.prev');
        this.nextBtn = this.lightbox?.querySelector('.media-lightbox-control.next');
        this.items = []; // Array de objetos { path, media_type }
        this.currentIndex = 0;
        this.init();
    }

    init() {
        if (!this.lightbox) return;
        // Listeners para cerrar y navegar
        this.closeBtn?.addEventListener('click', () => this.close());
        this.lightbox.addEventListener('click', (e) => { if (e.target === this.lightbox) this.close(); });
        this.prevBtn?.addEventListener('click', () => this.showSlide(this.currentIndex - 1));
        this.nextBtn?.addEventListener('click', () => this.showSlide(this.currentIndex + 1));
        // Podría añadirse navegación con teclado
    }

    open(items, startIndex = 0) {
        if (!items || items.length === 0 || !this.lightbox || !this.inner) return;
        this.items = items;
        this.currentIndex = startIndex;
        this.render(); // Genera el HTML del carrusel
        this.lightbox.classList.add('visible'); // Muestra el modal
        document.body.style.overflow = 'hidden'; // Evita scroll del fondo
    }

    close() {
        if (!this.lightbox) return;
        this.lightbox.classList.remove('visible');
        if (this.inner) this.inner.innerHTML = ''; // Limpia contenido
        // Pausar videos al cerrar
        this.lightbox.querySelectorAll('video').forEach(v => v.pause());
        document.body.style.overflow = ''; // Restaura scroll
    }

    render() {
        if (!this.inner || this.items.length === 0) return;
        // Genera un div.media-lightbox-carousel-item por cada item
        this.inner.innerHTML = this.items.map((item, index) => {
            let content;
            if (item.media_type === 'image') {
                content = `<img src="${item.path}" alt="Media ${index + 1}">`;
            } else if (item.media_type === 'video') {
                content = `<video controls preload="metadata"><source src="${item.path}">Video no soportado.</video>`;
            } else { content = `<span>Archivo no soportado</span>`; }
            // Añade clase 'active' al item actual
            return `<div class="media-lightbox-carousel-item ${index === this.currentIndex ? 'active' : ''}">${content}</div>`;
        }).join('');
        this.updateControls(); // Muestra/oculta botones prev/next
    }

    showSlide(index) {
        // Valida índice
        if (!this.inner || index < 0 || index >= this.items.length) return;
        const items = this.inner.querySelectorAll('.media-lightbox-carousel-item');
        // Quita 'active' del anterior y pausa video si existe
        if (items[this.currentIndex]) {
            items[this.currentIndex].classList.remove('active');
            items[this.currentIndex].querySelector('video')?.pause();
        }
        // Actualiza índice y añade 'active' al nuevo
        this.currentIndex = index;
        if (items[this.currentIndex]) {
            items[this.currentIndex].classList.add('active');
        }
        this.updateControls(); // Actualiza estado de botones prev/next
    }

    updateControls() {
        // Habilita/deshabilita o muestra/oculta botones prev/next según el índice actual
        // ... (código existente) ...
    }
}
window.MediaLightbox = MediaLightbox; // Exponer globalmente
```

### Uso

Se crea una instancia y se llama a `open()` pasándole el array de multimedia y el índice inicial.

```javascript
// En la página (ej. comunidad.js)
const lightbox = new window.MediaLightbox('media-lightbox'); // ID del modal en el HTML

container.addEventListener('click', (e) => {
    // Detectar click en imagen/video de una card
    const mediaTarget = e.target.closest('.publicacion-media img, .publicacion-media video');
    if (mediaTarget) {
        const card = mediaTarget.closest('.publicacion-card');
        const pubIndex = parseInt(card?.dataset.index, 10);
        const mediaIndex = parseInt(mediaTarget.dataset.mediaIndex || '0', 10); // Índice del medio dentro de la publi

        if (!isNaN(pubIndex) && cachedPublications[pubIndex]?.multimedia?.length > 0) {
            // Llama a open con el array de multimedia de la publicación y el índice clickeado
            lightbox.open(cachedPublications[pubIndex].multimedia, mediaIndex);
        }
    }
});
```

-----

## Short Polling para Actualizaciones

Varias páginas implementan "short polling" (peticiones periódicas a intervalos fijos) para buscar nuevo contenido sin recargar la página.

### Principio de Funcionamiento

1.  **Carga Inicial:** Se cargan los datos completos la primera vez. Se guarda una referencia (timestamp o ID del último elemento).
2.  **Intervalo:** Se inicia un `setInterval`.
3.  **Petición Periódica:** Cada N segundos, la función del intervalo hace una petición a la API, enviando la referencia guardada (ej. `?since=timestamp` o `?since_id=lastId`).
4.  **Respuesta del Backend:** El backend filtra y devuelve *solo* los elementos más nuevos que la referencia enviada.
5.  **Actualización del Frontend:**
      * Si la respuesta contiene nuevos elementos:
          * Se añaden al *principio* del array de datos en caché.
          * Se actualiza la referencia (timestamp o ID).
          * Se re-renderiza la lista/UI para mostrar los nuevos elementos.
      * Si la respuesta está vacía, no se hace nada.
6.  **Detención:** El polling se detiene (`clearInterval`) cuando el usuario navega a otra página, cambia filtros, o cierra la pestaña/navegador.

### Implementación (Ejemplo Generalizado)

```javascript
// Variable global en la página para el ID del intervalo
let pollingIntervalId = null;
// Variable para guardar la referencia del último elemento/tiempo
let lastFetchReference = 0; // Puede ser timestamp (Date.now()) o ID

// Función para cargar nuevos datos (llamada por el interval)
async function cargarNuevosDatos(endpointBase) {
    // Construir endpoint con el parámetro 'since' o 'since_id'
    const fetchUrl = lastFetchReference > 0
        ? `${endpointBase}&since=${lastFetchReference}` // Asumiendo que 'since' es timestamp
        : endpointBase; // La primera vez no se envía 'since'

    try {
        const nuevosDatos = await window.api.fetchAPI(fetchUrl);

        if (nuevosDatos && nuevosDatos.length > 0) {
            // Actualizar la referencia para la próxima petición
            lastFetchReference = Date.now(); // O el ID del último elemento nuevo: nuevosDatos[0].id;

            // Combinar nuevos datos con los existentes en caché
            cachedData = [...nuevosDatos, ...cachedData] // Añadir al principio
                .filter(/* lógica para eliminar duplicados si es necesario */)
                .sort(/* lógica de ordenamiento, ej. por fecha descendente */);

            // Re-renderizar la UI con los datos actualizados
            renderizarUI(cachedData);
        }
        // Si no hay nuevos datos, no se hace nada

    } catch (error) {
        console.error("Error en polling:", error);
        stopPolling(); // Detener si hay un error persistente
    }
}

// Función para iniciar el polling
function startPolling(endpointBase, intervalMs = 20000) { // ej. 20 segundos
    stopPolling(); // Asegura que no haya intervalos duplicados
    // Llamar a la función periódicamente
    pollingIntervalId = setInterval(() => cargarNuevosDatos(endpointBase), intervalMs);
}

// Función para detener el polling
function stopPolling() {
    if (pollingIntervalId) {
        clearInterval(pollingIntervalId);
        pollingIntervalId = null;
    }
}

// En el flujo principal de la página (ej. dentro de DOMContentLoaded):
// 1. Carga inicial de datos (sin 'since') y renderizado.
// 2. Obtener la referencia inicial (lastFetchReference).
// 3. Llamar a startPolling(endpointBase) para iniciar las actualizaciones.

// Asegurarse de detener el polling al cambiar filtros o salir de la página
// Ejemplo: al cambiar filtros
filtros.onFilterChange = (endpoint) => {
    stopPolling();
    cargarDatosIniciales(endpoint, true); // Carga inicial con nuevos filtros
};
// Ejemplo: al salir de la página
window.addEventListener('beforeunload', stopPolling);
```

### Ejemplos Específicos

  * **`comunidad.js`:** Usa `lastFetchTimestamp` y `?since=timestamp` para buscar nuevas publicaciones.
  * **`detallePublicacion.js`:** Usa `ultimoComentarioId` y `?since_id=lastId` para buscar nuevos comentarios.
  * **`miPerfil.js` / `perfilPublico.js`:** Usan `lastPubTimestamp` o `lastPubId` para buscar nuevas publicaciones del usuario.
  * **`barraNavegacion.js`:** Usa polling (`setInterval(actualizarBadgeAdmin, 15000)`) para actualizar el contador de publicaciones pendientes para el admin.

**Nota:** El backend debe estar preparado para recibir y procesar los parámetros `since` o `since_id` y devolver solo los registros correspondientes.

-----

## Flujo de Crear Publicación (crearPublicacion.js)

### Selección de Archivos y Preview

Permite seleccionar múltiples archivos y muestra una vista previa con opción de eliminar.

```javascript
// En pages/crearPublicacion.js
let selectedFiles = []; // Array para mantener los archivos seleccionados
const multimediaInput = document.getElementById('multimedia');
const previewContainer = document.getElementById('preview-container');

multimediaInput.addEventListener('change', (e) => {
    if (e.target.files) {
         const newFiles = Array.from(e.target.files);
         // Añadir nuevos archivos a la lista
         selectedFiles = selectedFiles.concat(newFiles);
         // Sincronizar el input.files con selectedFiles (necesario para el envío)
         const dataTransfer = new DataTransfer();
         selectedFiles.forEach(f => dataTransfer.items.add(f));
         multimediaInput.files = dataTransfer.files;
         // Actualizar la vista previa
         renderPreview();
    }
});

function renderPreview() {
    previewContainer.innerHTML = ''; // Limpiar preview
    selectedFiles.forEach((file, index) => {
        const previewItem = document.createElement('div');
        previewItem.className = 'preview-item';
        // Crear elemento de preview (img, video o icono/nombre)
        const reader = new FileReader();
        reader.onload = function(event) {
            let mediaElement;
            if (file.type.startsWith('image/')) { /* ... crear img ... */ }
            else if (file.type.startsWith('video/')) { /* ... crear video ... */ }
            else { /* ... crear div con nombre ... */ }
            if (event.target && mediaElement.tagName !== 'DIV') mediaElement.src = event.target.result;
            previewItem.appendChild(mediaElement);
        }
        // Leer archivo para mostrar preview (si es img/video)
        if (file.type.startsWith('image/') || file.type.startsWith('video/')) {
            reader.readAsDataURL(file);
        } else { reader.onload({ target: null }); } // Trigger onload para mostrar nombre

        // Botón para eliminar archivo de la selección
        const removeBtn = document.createElement('button');
        removeBtn.className = 'remove-btn'; removeBtn.innerHTML = '&times;'; removeBtn.type = 'button';
        removeBtn.onclick = () => {
            selectedFiles.splice(index, 1); // Quitar del array
            // Resincronizar input.files
            const dataTransfer = new DataTransfer();
            selectedFiles.forEach(f => dataTransfer.items.add(f));
            multimediaInput.files = dataTransfer.files;
            renderPreview(); // Re-renderizar preview
        };
        previewItem.appendChild(removeBtn);
        previewContainer.appendChild(previewItem);
    });
}
```

### Envío de Formulario

Envía primero los datos de la publicación (título, desc, etc.) y, si tiene éxito, envía los archivos multimedia.

```javascript
// En pages/crearPublicacion.js
form.addEventListener('submit', async (e) => {
    e.preventDefault();
    // ... Validaciones (categoría, al menos un archivo) ...
    const submitButton = form.querySelector('button[type="submit"]');
    submitButton.disabled = true; submitButton.textContent = 'Publicando...';

    const datosPublicacion = { /* ... obtener título, desc, categoría, mundial ... */ };
    let nuevaPublicacion;
    try {
        // 1. Crear la publicación (sin archivos)
        nuevaPublicacion = await window.api.fetchAPI('/publicaciones/', {
            method: 'POST', body: JSON.stringify(datosPublicacion),
        });
    } catch (error) { /* ... manejo de error ... */ submitButton.disabled = false; return; }

    // 2. Si se creó y hay archivos, subirlos
    if (nuevaPublicacion && selectedFiles.length > 0) {
        submitButton.textContent = 'Subiendo archivos...';
        const formData = new FormData();
        selectedFiles.forEach(file => formData.append('files', file)); // Clave 'files' esperada por backend

        try {
            // Llama al endpoint de subida de multimedia para esa publicación
            await window.api.fetchAPI(`/publicaciones/${nuevaPublicacion.id}/multimedia/`, {
                method: 'POST', body: formData
            });
            // Redirigir al detalle si todo OK
            window.location.href = `/publicaciones/${nuevaPublicacion.id}/`;
        } catch (mediaError) {
             // Informar al usuario que la publi se creó pero falló la subida
             mostrarError(`Publicación creada (ID: ${nuevaPublicacion.id}), pero falló la subida de archivos: ${mediaError.message}`);
             submitButton.textContent = 'Error al subir'; // No redirigir
        }
    } else if (nuevaPublicacion) {
        // Si se creó pero no había archivos (aunque debería haber validación), redirigir
        window.location.href = `/publicaciones/${nuevaPublicacion.id}/`;
    }
    // No rehabilitar botón si hay redirección
});
```

-----

## Sidebar y Navegación (sidebar.js / barraNavegacion.js)

### Renderizar Datos de Usuario (`sidebar.js`)

Muestra la información del usuario logueado en el sidebar.

```javascript
// En components/sidebar.js
async function renderizarComponentesDeUsuarioSidebar() {
    try {
        // Obtener datos del perfil actual desde la API
        const user = await window.api.fetchAPI('/usuarios/perfil/');
        if (!user) return; // Salir si no hay datos

        // Actualizar elementos del DOM en el sidebar
        const profileName = document.getElementById('profile-name');
        const profileNickname = document.getElementById('profile-nickname');
        const profilePicContainer = document.getElementById('sidebar-profile-pic-container');
        // ... (otros elementos si existen) ...

        if(profileName) profileName.textContent = user.nombre;
        if(profileNickname) profileNickname.textContent = `@${user.nickname}`;
        // Mostrar imagen o placeholder
        if (profilePicContainer) {
            profilePicContainer.innerHTML = user.foto_perfil
                ? `<img src="${user.foto_perfil}" alt="Foto de perfil">`
                : `<i class="fas fa-user-circle profile-placeholder-icon"></i>`;
        }
        // Configurar botón de logout
        document.getElementById('logout-button')?.addEventListener('click', (e) => {
             e.preventDefault(); window.auth.logout();
        });
    } catch (error) {
        // Si falla (ej. token expirado), limpiar y redirigir a login
        console.error("Error cargando datos en sidebar:", error);
        window.auth.clearAuthData();
        if (window.location.pathname !== '/login/') window.location.replace('/login/');
    }
}
```

### Cargar Categorías (`sidebar.js`)

Obtiene las categorías de la API y las muestra como links en el sidebar.

```javascript
// En components/sidebar.js
async function cargarCategoriasSidebar() {
    const categoriasList = document.getElementById('categorias-list');
    if (!categoriasList) return;
    try {
        const categorias = await window.api.fetchAPI('/publicaciones/categorias/');
        if (!categorias || categorias.length === 0) { /* ... mensaje "sin categorías" ... */ return; }
        // Generar HTML de los links
        let categoriasHTML = '';
        categorias.forEach(cat => {
            categoriasHTML += `<a href="#" class="categoria-item" data-id="${cat.id}" data-nombre="${cat.nombre}">${cat.nombre}</a>`;
        });
        categoriasList.innerHTML = categoriasHTML;

        // Añadir listener para manejar clicks en categorías
        categoriasList.addEventListener('click', (e) => {
            e.preventDefault();
            const target = e.target.closest('.categoria-item');
            if (target) {
                const categoryId = target.dataset.id;
                const categoryName = target.dataset.nombre;
                // Si estamos en /publicaciones, dispara evento para que Filtros lo capture
                if (window.location.pathname.startsWith('/publicaciones')) {
                     const event = new CustomEvent('filterByCategory', { detail: { categoryId, categoryName } });
                     document.dispatchEvent(event);
                } else {
                     // Si estamos en otra página, redirige a /publicaciones con el filtro
                     window.location.href = `/publicaciones/?categoria=${categoryId}`;
                }
            }
        });
    } catch (error) { /* ... mostrar error ... */ }
}
// Llamar a estas funciones en DOMContentLoaded si el usuario está logueado
```

### Inicialización Barra Navegación (`barraNavegacion.js`)

Configura la barra superior: carga mundiales, activa búsqueda y actualiza badge admin.

```javascript
// En components/barraNavegacion.js
async function inicializarBarraNavegacion(config = {}) {
    // Cargar mundiales en el select (usando FiltrosPublicaciones o lógica similar)
    // const filtros = new window.FiltrosPublicaciones({ /* ... config mínima ... */ });
    // await filtros.cargarMundialesSelect();

    // Configurar listener del form de búsqueda para redirigir a /publicaciones/?search=...
    const searchFormNav = document.getElementById('search-form-nav');
    const searchInputNav = document.getElementById('search-input-nav');
    if (searchFormNav && searchInputNav) {
        searchFormNav.addEventListener('submit', (e) => {
            e.preventDefault();
            const query = searchInputNav.value.trim();
            if (query) {
                window.location.href = `/publicaciones/?search=${encodeURIComponent(query)}`;
            }
        });
    }

    // Actualizar badge admin si es admin y la config lo permite
    if (config.mostrarAdminLink !== false && window.auth.isAdmin()) {
        if (window.adminStatsPoller) clearInterval(window.adminStatsPoller); // Limpiar anterior
        await actualizarBadgeAdmin(); // Carga inicial
        // Iniciar polling para el badge
        window.adminStatsPoller = setInterval(actualizarBadgeAdmin, 15000); // Cada 15s
    }
}
window.inicializarBarraNavegacion = inicializarBarraNavegacion; // Exponer

async function actualizarBadgeAdmin() {
    // Solo si es admin
    if (!window.auth.isAdmin()) { /* ... limpiar link/interval si existe ... */ return; }
    const adminNavContainer = document.getElementById('admin-nav-link-container');
    if (!adminNavContainer) return;
    try {
        // Obtener contador de pendientes
        const stats = await window.api.fetchAPI('/admin/stats/');
        const pendingCount = stats.publicaciones_pendientes;
        // Generar HTML del badge si count > 0
        const badgeHtml = pendingCount > 0 ? `<span class="notification-badge">${pendingCount}</span>` : '';
        // Actualizar el link en el DOM
        adminNavContainer.innerHTML = `<a href="/admin/" class="admin-nav-link">Admin Panel ${badgeHtml}</a>`;
    } catch (error) { console.error("Error al actualizar stats admin:", error); }
}

// Llamar a inicializarBarraNavegacion en DOMContentLoaded de cada página
```

-----

-----

## Patrones y Mejores Prácticas

### Manejo de Errores Consistente

Usar `try...catch` alrededor de las llamadas a `window.api.fetchAPI` y mostrar mensajes claros al usuario. Loguear detalles en la consola.

```javascript
try {
    const resultado = await window.api.fetchAPI('/endpoint/');
    procesarResultado(resultado);
} catch (error) {
    mostrarMensajeAlUsuario(`Error: ${error.message}`); // Función para UI
    console.error("Detalle del error:", error);
}
```

### Actualización de UI Optimista (con precaución)

Para acciones rápidas como likes o comentarios, actualizar la UI *antes* de que la API confirme puede mejorar la experiencia. Se debe tener un mecanismo para revertir si la API falla.

```javascript
// Ejemplo: Reacción
const countSpan = card.querySelector('.reaccion-count');
const currentCount = parseInt(countSpan.textContent);
countSpan.textContent = currentCount + 1; // Actualiza UI primero
try {
    await window.api.fetchAPI(`/publicaciones/${pubId}/reaccionar/`, { method: 'POST' });
    // Si la API confirma, no hacer nada más (ya está actualizado)
} catch (error) {
    countSpan.textContent = currentCount; // Revertir si falla
    alert('Error al reaccionar');
}
```

### Deshabilitar Botones Durante Peticiones

Evita envíos duplicados mostrando feedback visual.

```javascript
const submitButton = form.querySelector('button[type="submit"]');
submitButton.disabled = true;
submitButton.textContent = 'Enviando...'; // O un spinner
try {
    await window.api.fetchAPI('/endpoint/', { method: 'POST', body: data });
    // Éxito
} catch(e) {
    // Error
} finally {
    // Siempre rehabilitar y restaurar texto
    submitButton.disabled = false;
    submitButton.textContent = 'Enviar';
}
```

### Cache Local de Datos

Almacenar datos obtenidos de la API en variables locales (ej. `cachedPublications`) para reutilizarlos (ej. al abrir el lightbox) y para gestionar las actualizaciones del polling.

```javascript
let cachedPublications = []; // Variable global en el script de la página

async function cargarPublicaciones(endpoint) {
    const publicaciones = await window.api.fetchAPI(endpoint);
    cachedPublications = publicaciones; // Guardar en caché al cargar/recargar
    renderPublicaciones(publicaciones);
}

// Al abrir el lightbox, usar los datos del caché
lightbox.open(cachedPublications[index].multimedia, 0);

// Al recibir nuevos datos del polling, actualizar el caché
// cachedPublications = [...nuevosDatos, ...cachedPublications] ...
```

-----

## Eventos Personalizados

Útiles para la comunicación desacoplada entre componentes, como el sidebar y la página principal.

```javascript
// En sidebar.js, al hacer click en una categoría:
const event = new CustomEvent('filterByCategory', {
    detail: { categoryId: id, categoryName: name }
});
document.dispatchEvent(event);

// En filtros.js (o en la página principal si no usa Filtros):
document.addEventListener('filterByCategory', (event) => {
    // Acceder a los datos: event.detail.categoryId, event.detail.categoryName
    this.currentCategoriaId = event.detail.categoryId;
    // ... limpiar otros filtros y aplicar ...
    this.aplicarFiltros();
});
```

-----

## Inicialización de Páginas

Un patrón común para organizar el código que se ejecuta al cargar cada página.

```javascript
document.addEventListener('DOMContentLoaded', async () => {
    // 1. Proteger ruta si es necesario
    window.auth.protectRoute();

    // 2. Inicializar componentes globales (ej. barra de navegación)
    await window.inicializarBarraNavegacion({ /* config específica de la página */ });

    // 3. Inicializar componentes/lógica específicos de la página
    //    (ej. filtros, lightbox, listeners principales)
    const filtros = new window.FiltrosPublicaciones({ onFilterChange: cargarPublicaciones });
    const lightbox = new window.MediaLightbox('media-lightbox');
    setupPageEventListeners(); // Función que añade listeners al container principal, etc.

    // 4. Cargar datos iniciales necesarios para la página
    await cargarDatosPerfilSiNecesario();
    await cargarPublicaciones(filtros.getEndpointConFiltros(), true); // Carga inicial

    // 5. Iniciar polling si la página lo requiere
    startPolling(filtros.getEndpointConFiltros());

    // 6. Limpieza al salir (detener polling)
    window.addEventListener('beforeunload', stopPolling);
});
```

-----

## Notas Importantes

### `localStorage` vs `sessionStorage`

Se usa `localStorage` para que la sesión persista incluso si se cierra el navegador. `sessionStorage` la eliminaría al cerrar la pestaña/navegador.

### Separación de Responsabilidades

Mantener la lógica clara:

  * `api/`: Solo comunicación HTTP.
  * `components/`: UI reutilizable (barra, sidebar, carrusel...).
  * `pages/`: Orquestación y lógica específica de cada vista HTML.
  * `utils/`: Funciones auxiliares genéricas (crear cards, lightbox, manejo de comentarios...).

### Sistema de "Módulos" Globales

Dado que no se usa un bundler (como Webpack/Vite), las funciones y clases compartidas se exponen asignándolas al objeto `window`.

```javascript
// En auth.js
window.auth = { saveAuthData, getAuthToken, isLoggedIn, /* ... */ };

// En api.js
window.api = { fetchAPI };

// En publicaciones.js
window.publicacionesUtils = { crearCardPublicacion, /* ... */ };

// En otra parte (ej. comunidad.js)
if (window.auth.isLoggedIn()) {
    const pubs = await window.api.fetchAPI('/publicaciones/');
    pubs.forEach(p => container.appendChild(window.publicacionesUtils.crearCardPublicacion(p)));
}
```
# Guía del Frontend - FutBOX

## Organización de Archivos JavaScript

```
static/pw2/js/
├── api/
│   ├── api.js           # Cliente HTTP centralizado
│   └── auth.js          # Gestión de autenticación
├── components/
│   ├── barraNavegacion.js
│   ├── sidebar.js
│   ├── MenuPerfil.js
│   └── Carrusel.js
├── pages/
│   ├── index.js         # Página principal
│   ├── comunidad.js     # Lista de publicaciones
│   ├── detallePublicacion.js
│   ├── crearPublicacion.js
│   ├── login.js
│   ├── miPerfil.js
│   ├── perfilPublico.js
│   └── editarPerfil.js
├── utils/
│   ├── filtros.js       # Sistema de filtros reutilizable
│   ├── publicaciones.js # Generación de cards
│   ├── comentarios.js   # Gestión de comentarios
│   └── lightbox.js      # Modal de imágenes
└── admin/
    ├── adminPanel.js
    ├── adminPublicaciones.js
    ├── adminUsuarios.js
    └── ...
```

---

## Cliente HTTP (api.js)

### Configuración Base

```javascript
const BASE_URL = 'http://127.0.0.1:8000/api';

async function fetchAPI(endpoint, options = {}) {
    const url = `${BASE_URL}${endpoint}`;
    const headers = {};
    
    if (!(options.body instanceof FormData)) {
        headers['Content-Type'] = 'application/json';
    }
    
    const token = window.auth.getAuthToken();
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    
    const config = { ...options, headers };
    const response = await fetch(url, config);
    
    if (response.status === 401) {
        window.auth.clearAuthData();
        window.location.replace('/login/');
        throw new Error('Sesión expirada');
    }
    
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error en la petición');
    }
    
    return response.status === 204 ? null : await response.json();
}
```

### Uso Básico

```javascript
const publicaciones = await window.api.fetchAPI('/publicaciones/');

await window.api.fetchAPI('/publicaciones/', {
    method: 'POST',
    body: JSON.stringify({ titulo: 'Título', descripcion: 'Desc' })
});

const formData = new FormData();
formData.append('file', file);
await window.api.fetchAPI('/usuarios/perfil/actualizar-foto/', {
    method: 'POST',
    body: formData,
    headers: {}
});
```

---

## Sistema de Autenticación (auth.js)

### Almacenamiento de Credenciales

```javascript
function saveAuthData(token, userData) {
    localStorage.setItem('accessToken', token);
    localStorage.setItem('userData', JSON.stringify(userData));
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

```javascript
function protectRoute() {
    if (!isLoggedIn()) {
        clearAuthData();
        window.location.replace('/login/');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.auth.protectRoute();
});
```

### Verificación de Permisos

```javascript
function isAdmin() {
    const userData = getUserData();
    return userData && userData.rol === 'admin';
}

if (window.auth.isAdmin()) {
    mostrarPanelAdmin();
}
```

---

## Flujo de Login y Registro (login.js)

### Login

```javascript
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const data = {
        correo: loginForm.email.value,
        password: loginForm.password.value,
    };
    
    const result = await window.api.fetchAPI('/usuarios/login/', {
        method: 'POST',
        body: JSON.stringify(data),
    });
    
    window.auth.saveAuthData(result.access, result.usuario);
    window.location.replace('/');
});
```

### Registro

```javascript
registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = new FormData(registerForm);
    const data = Object.fromEntries(formData.entries());
    
    await window.api.fetchAPI('/usuarios/registro/', {
        method: 'POST',
        body: JSON.stringify(data),
    });
    
    const loginData = {
        correo: data.correo,
        password: data.password
    };
    
    const result = await window.api.fetchAPI('/usuarios/login/', {
        method: 'POST',
        body: JSON.stringify(loginData),
    });
    
    window.auth.saveAuthData(result.access, result.usuario);
    window.location.replace('/');
});
```

---

## Sistema de Filtros (filtros.js)

### Clase FiltrosPublicaciones

```javascript
class FiltrosPublicaciones {
    constructor(config) {
        this.searchInput = document.getElementById('search-input-nav');
        this.mundialSelect = document.getElementById('mundial-filter-nav');
        this.onFilterChange = config.onFilterChange;
        
        this.currentSearchQuery = '';
        this.currentMundialId = '';
        this.currentCategoriaId = '';
        
        this.init();
    }
    
    init() {
        this.cargarFiltrosDesdeURL();
        this.cargarMundialesSelect();
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        this.searchForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.currentSearchQuery = this.searchInput.value.trim();
            this.aplicarFiltros();
        });
        
        this.mundialSelect.addEventListener('change', (e) => {
            this.currentMundialId = e.target.value;
            this.aplicarFiltros();
        });
    }
    
    aplicarFiltros() {
        if (this.onFilterChange) {
            this.onFilterChange(this.getEndpointConFiltros());
        }
    }
    
    getEndpointConFiltros() {
        let endpoint = '/publicaciones/?';
        const params = [];
        if (this.currentSearchQuery) params.push(`search=${encodeURIComponent(this.currentSearchQuery)}`);
        if (this.currentMundialId) params.push(`mundial=${this.currentMundialId}`);
        if (this.currentCategoriaId) params.push(`categoria=${this.currentCategoriaId}`);
        return endpoint + params.join('&');
    }
}
```

### Uso en Página

```javascript
const filtros = new window.FiltrosPublicaciones({
    tituloSeccionId: 'titulo-seccion',
    onFilterChange: cargarPublicaciones
});

async function cargarPublicaciones(endpoint) {
    const publicaciones = await window.api.fetchAPI(endpoint || '/publicaciones/');
    renderPublicaciones(publicaciones);
}
```

---

## Renderizado de Publicaciones (publicaciones.js)

### Generar Card de Publicación

```javascript
function crearCardPublicacion(pub, pubIndex, incluirEstatus = false) {
    const fecha = new Date(pub.fecha_publicacion).toLocaleDateString('es-ES');
    
    const profilePicHTML = pub.autor.foto_perfil
        ? `<img src="${pub.autor.foto_perfil}" alt="Foto de perfil">`
        : `<i class="fas fa-user-circle profile-placeholder-icon"></i>`;
    
    const mediaHTML = pub.multimedia && pub.multimedia.length > 0
        ? `<img src="${pub.multimedia[0].path}" alt="Multimedia">`
        : `<span class="media-placeholder-icon"><i class="far fa-image"></i></span>`;
    
    const card = document.createElement('div');
    card.className = 'publicacion-card';
    card.dataset.id = pub.id;
    card.dataset.index = pubIndex;
    
    card.innerHTML = `
        <div class="publicacion-media">${mediaHTML}</div>
        <div class="publicacion-info">
            <div class="publicacion-header">
                ${profilePicHTML}
                <div class="publicacion-autor-info">
                    <span class="nombre">${pub.autor.nombre}</span>
                    <p class="fecha">@${pub.autor.nickname} - ${fecha}</p>
                </div>
            </div>
            <div class="publicacion-body" onclick="window.location.href='/publicaciones/${pub.id}/'">
                <h3>${pub.titulo}</h3>
                <p>${pub.descripcion}</p>
            </div>
            <div class="publicacion-footer">
                <div class="publicacion-stats">
                    <div class="reacciones-info">
                        <i class="fas fa-heart"></i>
                        <span class="reaccion-count">${pub.reacciones_count}</span>
                    </div>
                    <div class="comentarios-info">
                        <i class="fas fa-comment"></i>
                        <span>${pub.comentarios_count}</span>
                    </div>
                </div>
                <form class="comentario-form">
                    <textarea placeholder="Añade un comentario..."></textarea>
                    <button type="submit">Publicar</button>
                </form>
            </div>
        </div>
    `;
    
    return card;
}
```

---

## Gestión de Comentarios (comentarios.js)

### Cargar y Renderizar Comentarios

```javascript
async function cargarYRenderizarComentariosPreview(publicacionId) {
    const previewContainer = document.querySelector(`.card-comentarios-preview[data-pub-id="${publicacionId}"]`);
    
    const comentarios = await window.api.fetchAPI(`/publicaciones/${publicacionId}/comentarios/`);
    
    if (comentarios.length === 0) {
        previewContainer.innerHTML = '<p class="no-comments">Sin comentarios aún.</p>';
        return;
    }
    
    let comentariosHTML = '';
    comentarios.forEach(com => {
        comentariosHTML += `
            <div class="card-comentario-item">
                <strong>@${com.usuario.nickname}:</strong>
                <p>${com.comentario.substring(0, 50)}...</p>
            </div>
        `;
    });
    previewContainer.innerHTML = comentariosHTML;
}
```

### Manejar Envío de Comentario

```javascript
async function manejarComentario(e, publicacionId, card) {
    e.preventDefault();
    const textarea = e.target.querySelector('textarea');
    const texto = textarea.value.trim();
    
    await window.api.fetchAPI(`/publicaciones/${publicacionId}/comentarios/`, {
        method: 'POST',
        body: JSON.stringify({ comentario: texto }),
    });
    
    textarea.value = '';
    
    const commentInfo = card.querySelector('.comentarios-info span');
    let currentCount = parseInt(commentInfo.textContent, 10);
    commentInfo.textContent = currentCount + 1;
    
    cargarYRenderizarComentariosPreview(publicacionId);
}
```

### Manejar Reacción

```javascript
async function manejarReaccion(publicacionId, card) {
    const resultado = await window.api.fetchAPI(`/publicaciones/${publicacionId}/reaccionar/`, {
        method: 'POST'
    });
    
    const countSpan = card.querySelector('.reaccion-count');
    let currentCount = parseInt(countSpan.textContent, 10);
    
    if (resultado.status === 'reaccion_creada') {
        countSpan.textContent = currentCount + 1;
    } else if (resultado.status === 'reaccion_eliminada') {
        countSpan.textContent = Math.max(0, currentCount - 1);
    }
}
```

---

## Lightbox de Imágenes (lightbox.js)

### Clase MediaLightbox

```javascript
class MediaLightbox {
    constructor(lightboxId) {
        this.lightbox = document.getElementById(lightboxId);
        this.inner = this.lightbox.querySelector('.media-lightbox-carousel-inner');
        this.closeBtn = this.lightbox.querySelector('.lightbox-close');
        this.items = [];
        this.currentIndex = 0;
        this.init();
    }
    
    open(items, startIndex = 0) {
        this.items = items;
        this.currentIndex = startIndex;
        this.render();
        this.lightbox.classList.add('visible');
    }
    
    render() {
        this.inner.innerHTML = this.items.map((item, index) => {
            const content = item.media_type === 'image'
                ? `<img src="${item.path}" alt="Media">`
                : `<video controls><source src="${item.path}"></video>`;
            
            return `<div class="media-lightbox-carousel-item ${index === this.currentIndex ? 'active' : ''}">${content}</div>`;
        }).join('');
    }
    
    showSlide(index) {
        const items = this.inner.querySelectorAll('.media-lightbox-carousel-item');
        items[this.currentIndex].classList.remove('active');
        this.currentIndex = index;
        items[this.currentIndex].classList.add('active');
    }
}
```

### Uso

```javascript
const lightbox = new window.MediaLightbox('media-lightbox');

container.addEventListener('click', (e) => {
    const mediaTarget = e.target.closest('.publicacion-media img');
    if (mediaTarget) {
        const pub = cachedPublications[publicationIndex];
        lightbox.open(pub.multimedia, 0);
    }
});
```

---

## Flujo de Crear Publicación (crearPublicacion.js)

### Selección de Archivos

```javascript
let selectedFiles = [];

inputImagenes.addEventListener('change', (e) => {
    const newFiles = Array.from(e.target.files);
    selectedFiles = selectedFiles.concat(newFiles);
    renderPreview();
});

function renderPreview() {
    previewContainer.innerHTML = '';
    selectedFiles.forEach((file, index) => {
        const reader = new FileReader();
        reader.onload = function(e) {
            const img = document.createElement('img');
            img.src = e.target.result;
            previewContainer.appendChild(img);
        };
        reader.readAsDataURL(file);
    });
}
```

### Envío de Formulario

```javascript
form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const datosPublicacion = {
        titulo: form.titulo.value,
        descripcion: form.descripcion.value,
        categoria: parseInt(form.categoria.value, 10),
        mundial: form.mundial.value ? parseInt(form.mundial.value, 10) : null,
    };
    
    const nuevaPublicacion = await window.api.fetchAPI('/publicaciones/', {
        method: 'POST',
        body: JSON.stringify(datosPublicacion),
    });
    
    if (selectedFiles.length > 0) {
        const formData = new FormData();
        selectedFiles.forEach(file => formData.append('files', file));
        
        await window.api.fetchAPI(`/publicaciones/${nuevaPublicacion.id}/multimedia/`, {
            method: 'POST',
            body: formData
        });
    }
    
    window.location.href = `/publicaciones/${nuevaPublicacion.id}/`;
});
```

---

## Sidebar y Navegación (sidebar.js)

### Renderizar Datos de Usuario

```javascript
async function renderizarComponentesDeUsuarioSidebar() {
    const user = await window.api.fetchAPI('/usuarios/perfil/');
    
    document.getElementById('profile-name').textContent = user.nombre;
    document.getElementById('profile-nickname').textContent = `@${user.nickname}`;
    
    const profilePicContainer = document.getElementById('sidebar-profile-pic-container');
    if (user.foto_perfil) {
        profilePicContainer.innerHTML = `<img src="${user.foto_perfil}" alt="Foto de perfil">`;
    } else {
        profilePicContainer.innerHTML = `<i class="fas fa-user-circle profile-placeholder-icon"></i>`;
    }
}
```

### Cargar Categorías

```javascript
async function cargarCategoriasSidebar() {
    const categorias = await window.api.fetchAPI('/publicaciones/categorias/');
    
    let categoriasHTML = '';
    categorias.forEach(categoria => {
        categoriasHTML += `<a href="#" class="categoria-item" data-id="${categoria.id}">${categoria.nombre}</a>`;
    });
    categoriasList.innerHTML = categoriasHTML;
    
    categoriasList.addEventListener('click', (e) => {
        e.preventDefault();
        const target = e.target;
        if (target.classList.contains('categoria-item')) {
            const categoryId = target.dataset.id;
            const categoryName = target.dataset.nombre;
            
            const event = new CustomEvent('filterByCategory', {
                detail: { categoryId, categoryName }
            });
            document.dispatchEvent(event);
        }
    });
}
```

---

## Página de Comunidad (comunidad.js)

### Flujo Principal

```javascript
document.addEventListener('DOMContentLoaded', async () => {
    window.auth.protectRoute();
    
    const container = document.getElementById('publicaciones-container');
    const lightbox = new window.MediaLightbox('media-lightbox');
    let cachedPublications = [];
    
    const filtros = new window.FiltrosPublicaciones({
        tituloSeccionId: 'titulo-seccion',
        onFilterChange: cargarPublicaciones
    });
    
    async function cargarPublicaciones(endpoint) {
        container.innerHTML = '<p>Cargando publicaciones...</p>';
        
        const publicaciones = await window.api.fetchAPI(endpoint || '/publicaciones/');
        cachedPublications = publicaciones;
        
        container.innerHTML = '';
        publicaciones.forEach((pub, pubIndex) => {
            const card = window.publicacionesUtils.crearCardPublicacion(pub, pubIndex, false);
            container.appendChild(card);
            window.comentariosUtils.cargarYRenderizarComentariosPreview(pub.id);
        });
    }
    
    container.addEventListener('click', async (e) => {
        const card = e.target.closest('.publicacion-card');
        if (!card) return;
        
        const publicacionId = card.dataset.id;
        const publicationIndex = parseInt(card.dataset.index, 10);
        
        if (e.target.closest('.reacciones-info')) {
            window.comentariosUtils.manejarReaccion(publicacionId, card, cachedPublications, publicationIndex);
        }
    });
    
    container.addEventListener('submit', async (e) => {
        if (e.target.classList.contains('comentario-form')) {
            const card = e.target.closest('.publicacion-card');
            const publicacionId = card.dataset.id;
            const publicationIndex = parseInt(card.dataset.index, 10);
            window.comentariosUtils.manejarComentario(e, publicacionId, card, cachedPublications, publicationIndex);
        }
    });
    
    await window.inicializarBarraNavegacion();
    filtros.aplicarFiltros();
});
```

---

## Detalle de Publicación (detallePublicacion.js)

### Renderizado Completo

```javascript
async function cargarDetalleCompleto() {
    const [publicacion, comentarios] = await Promise.all([
        window.api.fetchAPI(`/publicaciones/${publicacionId}/`),
        window.api.fetchAPI(`/publicaciones/${publicacionId}/comentarios/`)
    ]);
    
    renderizarDetalle(publicacion);
    renderizarComentarios(comentarios);
    configurarFormularioComentario();
    configurarBotonReaccion(publicacion.reacciones_count);
}

function renderizarDetalle(pub) {
    container.innerHTML = `
        <div class="detalle-publicacion-card">
            <div class="detalle-header">
                <img src="${pub.autor.foto_perfil}" alt="Foto">
                <div class="detalle-autor">
                    <span>${pub.autor.nombre}</span>
                    <p>@${pub.autor.nickname}</p>
                </div>
            </div>
            <div class="detalle-body">
                <h1>${pub.titulo}</h1>
                <p>${pub.descripcion}</p>
                <div class="detalle-multimedia">
                    <img src="${pub.multimedia[0].path}" alt="${pub.titulo}">
                </div>
            </div>
            <div class="detalle-footer">
                <button class="reaccion-btn" id="reaccion-btn">
                    <i class="fas fa-heart"></i>
                    <span id="reaccion-count">${pub.reacciones_count}</span>
                </button>
            </div>
        </div>
        <div class="comentarios-section">
            <h2>Comentarios</h2>
            <form class="nuevo-comentario-form" id="comentario-form">
                <textarea id="comentario-texto" placeholder="Escribe tu comentario..."></textarea>
                <button type="submit">Comentar</button>
            </form>
            <div id="comentarios-lista"></div>
        </div>
    `;
}
```

### Configurar Comentarios

```javascript
function configurarFormularioComentario() {
    const form = document.getElementById('comentario-form');
    const textarea = document.getElementById('comentario-texto');
    
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const texto = textarea.value.trim();
        
        const nuevoComentario = await window.api.fetchAPI(`/publicaciones/${publicacionId}/comentarios/`, {
            method: 'POST',
            body: JSON.stringify({ comentario: texto }),
        });
        
        textarea.value = '';
        anadirComentarioALista(nuevoComentario);
    });
}
```

---

## Perfil de Usuario (miPerfil.js)

### Cargar Datos y Publicaciones

```javascript
document.addEventListener('DOMContentLoaded', async () => {
    window.auth.protectRoute();
    
    const lightbox = new window.MediaLightbox('media-lightbox');
    let cachedMiPerfilPublications = [];
    const filtroEstatusSelect = document.getElementById('filtro-estatus-perfil');
    
    async function cargarDatosPerfil() {
        const userData = await window.api.fetchAPI('/usuarios/perfil/');
        
        container.innerHTML = `
            <div class="perfil-header">
                <img src="${userData.foto_perfil}" class="perfil-foto-grande">
                <div class="perfil-info">
                    <h1>${userData.nombre}</h1>
                    <p>@${userData.nickname}</p>
                    <p>${userData.correo}</p>
                    <div class="perfil-acciones">
                        <a href="/editar-perfil/" class="btn-editar-perfil">Editar Perfil</a>
                        <button id="logout-button" class="btn-cerrar-sesion">Cerrar Sesion</button>
                    </div>
                </div>
            </div>
        `;
    }
    
    async function cargarMisPublicaciones(estatus = '') {
        let endpoint = '/usuarios/mis-publicaciones/';
        if (estatus) endpoint += `?estatus=${estatus}`;
        
        const publicaciones = await window.api.fetchAPI(endpoint);
        cachedMiPerfilPublications = publicaciones;
        
        container.innerHTML = '';
        publicaciones.forEach((pub, pubIndex) => {
            const card = window.publicacionesUtils.crearCardPublicacion(pub, pubIndex, true);
            container.appendChild(card);
            
            if (pub.estatus === 'aprobada') {
                window.comentariosUtils.cargarYRenderizarComentariosPreview(pub.id);
            }
        });
    }
    
    if (filtroEstatusSelect) {
        filtroEstatusSelect.addEventListener('change', (e) => {
            cargarMisPublicaciones(e.target.value);
        });
    }
    
    await cargarDatosPerfil();
    await cargarMisPublicaciones();
});
```

---

## Admin Panel (adminPublicaciones.js)

### Moderación de Publicaciones

```javascript
document.addEventListener('DOMContentLoaded', async () => {
    window.auth.protectRoute();
    
    const userData = window.auth.getUserData();
    if (!userData || userData.rol !== 'admin') {
        window.location.href = '/';
        return;
    }
    
    const container = document.getElementById('publicaciones-pendientes-container');
    
    async function cargarPublicacionesPendientes() {
        const publicaciones = await window.api.fetchAPI('/admin/publicaciones/pendientes/');
        renderTablaPublicaciones(publicaciones);
    }
    
    function renderTablaPublicaciones(publicaciones) {
        let tableHTML = `
            <table class="admin-table">
                <thead>
                    <tr>
                        <th>Título</th>
                        <th>Autor</th>
                        <th>Fecha</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody>
        `;
        
        publicaciones.forEach(pub => {
            const fecha = new Date(pub.fecha_publicacion).toLocaleDateString('es-ES');
            tableHTML += `
                <tr id="pub-row-${pub.id}">
                    <td>${pub.titulo}</td>
                    <td>@${pub.autor.nickname}</td>
                    <td>${fecha}</td>
                    <td class="actions-cell">
                        <button class="btn-preview" data-id="${pub.id}">Previsualizar</button>
                        <button class="btn-approve" data-id="${pub.id}">Aprobar</button>
                        <button class="btn-reject" data-id="${pub.id}">Rechazar</button>
                    </td>
                </tr>
            `;
        });
        
        tableHTML += '</tbody></table>';
        container.innerHTML = tableHTML;
    }
    
    container.addEventListener('click', async (e) => {
        const target = e.target;
        const publicacionId = target.dataset.id;
        
        if (target.classList.contains('btn-approve')) {
            await window.api.fetchAPI(`/admin/publicaciones/${publicacionId}/aprobar/`, {
                method: 'PUT'
            });
            document.getElementById(`pub-row-${publicacionId}`).remove();
        } else if (target.classList.contains('btn-reject')) {
            await window.api.fetchAPI(`/admin/publicaciones/${publicacionId}/rechazar/`, {
                method: 'PUT'
            });
            document.getElementById(`pub-row-${publicacionId}`).remove();
        }
    });
    
    cargarPublicacionesPendientes();
});
```

---

## Gestión de Mundiales Admin (adminMundiales.js)

### Formulario con Selección de Países

```javascript
function mostrarFormulario(mundial = null) {
    let selectedPaises = new Map(mundial ? mundial.sedes.map(s => [s.id, s]) : []);
    
    const renderPaises = () => {
        availableBox.innerHTML = '<h4>Disponibles</h4>';
        selectedBox.innerHTML = '<h4>Seleccionadas</h4>';
        
        todosLosPaises.forEach(p => {
            if (!selectedPaises.has(p.id)) {
                const item = document.createElement('div');
                item.className = 'country-item';
                item.textContent = p.pais;
                item.onclick = () => {
                    selectedPaises.set(p.id, p);
                    renderPaises();
                };
                availableBox.appendChild(item);
            }
        });
        
        Array.from(selectedPaises.values()).forEach(p => {
            const item = document.createElement('div');
            item.className = 'country-item';
            item.innerHTML = `<span>${p.pais}</span><button type="button" class="remove-country-btn">&times;</button>`;
            item.querySelector('.remove-country-btn').onclick = (e) => {
                e.stopPropagation();
                selectedPaises.delete(p.id);
                renderPaises();
            };
            selectedBox.appendChild(item);
        });
    };
    
    renderPaises();
}
```

### Subida de Archivos Múltiples

```javascript
let selectedFiles = [];

inputImagenes.addEventListener('change', (e) => {
    const newFiles = Array.from(e.target.files);
    selectedFiles = selectedFiles.concat(newFiles);
    
    const dataTransfer = new DataTransfer();
    selectedFiles.forEach(f => dataTransfer.items.add(f));
    inputImagenes.files = dataTransfer.files;
    
    renderPreview();
});

function renderPreview() {
    previewContainer.innerHTML = '';
    selectedFiles.forEach((file, index) => {
        const reader = new FileReader();
        reader.onload = function(e) {
            const previewItem = document.createElement('div');
            previewItem.className = 'preview-item';
            
            const mediaElement = file.type.startsWith('image/')
                ? document.createElement('img')
                : document.createElement('video');
            mediaElement.src = e.target.result;
            
            const removeBtn = document.createElement('button');
            removeBtn.className = 'remove-btn';
            removeBtn.innerHTML = '&times;';
            removeBtn.onclick = () => {
                selectedFiles.splice(index, 1);
                const dataTransfer = new DataTransfer();
                selectedFiles.forEach(f => dataTransfer.items.add(f));
                inputImagenes.files = dataTransfer.files;
                renderPreview();
            };
            
            previewItem.appendChild(mediaElement);
            previewItem.appendChild(removeBtn);
            previewContainer.appendChild(previewItem);
        };
        reader.readAsDataURL(file);
    });
}
```

---

## Patrones y Mejores Prácticas

### Manejo de Errores Consistente

```javascript
try {
    const resultado = await window.api.fetchAPI('/endpoint/');
    procesarResultado(resultado);
} catch (error) {
    alert(`Error: ${error.message}`);
    console.error(error);
}
```

### Actualización de UI Optimista

```javascript
commentInfo.textContent = currentCount + 1;

await window.api.fetchAPI('/comentarios/', {
    method: 'POST',
    body: JSON.stringify(data)
});
```

### Deshabilitar Botones Durante Peticiones

```javascript
const submitButton = form.querySelector('button[type="submit"]');
submitButton.disabled = true;
submitButton.textContent = 'Enviando...';

await window.api.fetchAPI('/endpoint/', { method: 'POST', body: data });

submitButton.disabled = false;
submitButton.textContent = 'Enviar';
```

### Cache Local de Datos

```javascript
let cachedPublications = [];

async function cargarPublicaciones() {
    const publicaciones = await window.api.fetchAPI('/publicaciones/');
    cachedPublications = publicaciones;
    renderPublicaciones(publicaciones);
}

lightbox.open(cachedPublications[index].multimedia, 0);
```

---

## Eventos Personalizados

### Comunicación Entre Componentes

```javascript
const event = new CustomEvent('filterByCategory', {
    detail: { categoryId: id, categoryName: name }
});
document.dispatchEvent(event);

document.addEventListener('filterByCategory', (event) => {
    this.currentCategoriaId = event.detail.categoryId;
    this.aplicarFiltros();
});
```

---

## Inicialización de Páginas

### Patrón Común

```javascript
document.addEventListener('DOMContentLoaded', async () => {
    window.auth.protectRoute();
    
    await inicializarComponentes();
    await cargarDatosIniciales();
    configurarEventListeners();
});
```

### Orden de Ejecución

1. Verificar autenticación
2. Inicializar sistema de filtros
3. Cargar datos del usuario
4. Cargar contenido principal
5. Configurar event listeners
6. Inicializar componentes de UI

---

## Notas Importantes

### localStorage vs sessionStorage

El sistema usa localStorage para persistencia de autenticación entre sesiones.

### Separación de Responsabilidades

- api/: Solo comunicación HTTP
- components/: UI reutilizable
- pages/: Lógica específica de página
- utils/: Funciones auxiliares compartidas

### Sistema de Módulos

Todos los archivos se cargan como scripts independientes. Las funciones compartidas se exponen en window:

```javascript
window.auth = { saveAuthData, getAuthToken, ... };
window.api = { fetchAPI };
window.publicacionesUtils = { crearCardPublicacion, ... };
```
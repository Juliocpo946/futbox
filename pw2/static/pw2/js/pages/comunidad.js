document.addEventListener('DOMContentLoaded', async () => {
    window.auth.protectRoute();

    const container = document.getElementById('publicaciones-container');
    const searchForm = document.getElementById('search-form-nav');
    const searchInput = document.getElementById('search-input-nav');
    const tituloSeccion = document.getElementById('titulo-seccion');

    async function cargarPublicaciones(query = '') {
        try {
            let endpoint = '/publicaciones/';
            if (query) {
                endpoint += `?search=${encodeURIComponent(query)}`;
                tituloSeccion.innerHTML = `Resultados para: <span class="query-term">"${query}"</span>`;
            } else {
                tituloSeccion.textContent = 'Comunidad';
            }
            const publicaciones = await window.api.fetchAPI(endpoint);
            renderPublicaciones(publicaciones);
        } catch (error) {
            container.innerHTML = '<p>Error al cargar las publicaciones. Intentalo de nuevo mas tarde.</p>';
        }
    }

    function renderPublicaciones(publicaciones) {
        if (publicaciones.length === 0) {
            container.innerHTML = '<p>No se encontraron publicaciones que coincidan. Se el primero en publicar!</p>';
            return;
        }

        container.innerHTML = '';
        publicaciones.forEach(pub => {
            const fecha = new Date(pub.fecha_publicacion).toLocaleDateString('es-ES', {
                year: 'numeric', month: 'long', day: 'numeric'
            });
            const card = document.createElement('div');
            card.className = 'publicacion-card';
            
            card.innerHTML = `
                <div class="publicacion-header">
                    <img src="${pub.autor.foto_perfil || '/static/pw2/images/Haerin.jpg'}" alt="Foto de perfil del autor">
                    <div class="publicacion-autor-info">
                        <span class="nombre">${pub.autor.nombre}</span>
                        <p class="fecha"><a href="/perfil/${pub.autor.nickname}/">@${pub.autor.nickname}</a> - ${fecha}</p>
                    </div>
                </div>
                <div class="publicacion-body" style="cursor: pointer;" onclick="window.location.href='/publicaciones/${pub.id}/'">
                    <h3>${pub.titulo}</h3>
                    <p>${pub.descripcion}</p>
                </div>
                <div class="publicacion-footer">
                    <div class="reacciones-info">
                        <i class="fas fa-heart"></i>
                        <span>${pub.reacciones_count} Reacciones</span>
                    </div>
                    <div class="comentarios-info" onclick="window.location.href='/publicaciones/${pub.id}/'">
                        <i class="fas fa-comment"></i>
                        <span>Comentarios</span>
                    </div>
                </div>
            `;
            container.appendChild(card);
        });
    }

    async function renderizarComponentesDeUsuario() {
        try {
            const user = await window.api.fetchAPI('/usuarios/perfil/');
            if (!user) return;
            document.getElementById('profile-name').textContent = user.nombre;
            document.getElementById('profile-nickname').textContent = `@${user.nickname}`;
            const profilePic = document.getElementById('profile-pic');
            if (user.foto_perfil) {
                profilePic.src = user.foto_perfil;
            } else {
                profilePic.src = '/static/pw2/images/Haerin.jpg';
            }
            const logoutBtn = document.getElementById('logout-button');
            if (logoutBtn) {
                logoutBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    window.auth.logout();
                });
            }
        } catch (error) {
            window.auth.clearAuthData();
            window.location.replace('/login/');
        }
    }

    async function cargarCategorias() {
        try {
            const categorias = await window.api.fetchAPI('/publicaciones/categorias/');
            const categoriasList = document.getElementById('categorias-list');
            if (!categoriasList) return;
            if (!categorias || categorias.length === 0) {
                categoriasList.innerHTML = '<p>No hay categorías.</p>';
                return;
            }
            let categoriasHTML = '';
            categorias.forEach(cat => {
                categoriasHTML += `<a href="#" class="categoria-item">${cat.nombre}</a>`;
            });
            categoriasList.innerHTML = categoriasHTML;
        } catch (error) {
            console.error('Error al cargar categorías');
        }
    }
    
    searchForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const query = searchInput.value.trim();
        cargarPublicaciones(query);
    });

    const pendingQuery = sessionStorage.getItem('searchQuery');
    if (pendingQuery) {
        searchInput.value = pendingQuery;
        cargarPublicaciones(pendingQuery);
        sessionStorage.removeItem('searchQuery');
    } else {
        cargarPublicaciones();
    }
    
    renderizarComponentesDeUsuario();
    cargarCategorias();
});
document.addEventListener('DOMContentLoaded', async () => {
    if (!window.auth.isLoggedIn()) {
        window.location.href = '/login/';
        return;
    }

    const container = document.getElementById('resultados-container');
    const titulo = document.getElementById('titulo-resultados');
    const urlParams = new URLSearchParams(window.location.search);
    const query = urlParams.get('q');

    if (!query) {
        titulo.textContent = 'No se especificó un término de búsqueda.';
        return;
    }

    titulo.innerHTML = `Resultados para: <span class="query-term">"${query}"</span>`;

    async function buscarPublicaciones() {
        try {
            const resultados = await window.api.fetchAPI(`/publicaciones/?search=${encodeURIComponent(query)}`);
            renderResultados(resultados);
        } catch (error) {
            container.innerHTML = '<p>Error al realizar la búsqueda. Inténtalo de nuevo más tarde.</p>';
        }
    }

    function renderResultados(resultados) {
        if (resultados.length === 0) {
            container.innerHTML = '<p>No se encontraron publicaciones que coincidan con tu búsqueda.</p>';
            return;
        }

        container.innerHTML = '';
        resultados.forEach(pub => {
            const fecha = new Date(pub.fecha_publicacion).toLocaleDateString('es-ES');
            const card = document.createElement('div');
            card.className = 'publicacion-card';
            card.style.cursor = 'pointer';
            card.onclick = () => { window.location.href = `/publicaciones/${pub.id}/`; };

            card.innerHTML = `
                <div class="publicacion-header">
                    <div class="publicacion-autor-info">
                        <span class="nombre">${pub.autor.nombre}</span>
                        <p class="fecha">@${pub.autor.nickname} - ${fecha}</p>
                    </div>
                </div>
                <div class="publicacion-body">
                    <h3>${pub.titulo}</h3>
                    <p>${pub.descripcion.substring(0, 150)}...</p>
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

    buscarPublicaciones();
    renderizarComponentesDeUsuario();
    cargarCategorias();
});
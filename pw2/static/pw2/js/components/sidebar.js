async function renderizarComponentesDeUsuarioSidebar() {
    try {
        const user = await window.api.fetchAPI('/usuarios/perfil/');
        if (!user) return;

        const profileName = document.getElementById('profile-name');
        const profileNickname = document.getElementById('profile-nickname');
        const profilePicContainer = document.getElementById('sidebar-profile-pic-container'); // Cambiado a contenedor
        const logoutBtn = document.getElementById('logout-button');

        if(profileName) profileName.textContent = user.nombre;
        if(profileNickname) profileNickname.textContent = `@${user.nickname}`;

        if (profilePicContainer) {
            if (user.foto_perfil) {
                // Crear y añadir imagen si existe
                profilePicContainer.innerHTML = `<img id="profile-pic" src="${user.foto_perfil}" alt="Foto de perfil">`;
            } else {
                // Mostrar icono si no existe
                profilePicContainer.innerHTML = `<i class="fas fa-user-circle profile-placeholder-icon"></i>`;
            }
        }

        if (logoutBtn) {
            logoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                window.auth.logout();
            });
        }
    } catch (error) {
        console.error("Error cargando datos de usuario en sidebar, redirigiendo a login:", error);
        window.auth.clearAuthData();
        if (window.location.pathname !== '/login/') {
            window.location.replace('/login/');
        }
    }
}

async function cargarCategoriasSidebar() {
    const categoriasList = document.getElementById('categorias-list');
    if (!categoriasList) return;
    try {
        const categorias = await window.api.fetchAPI('/publicaciones/categorias/');
        renderizarCategoriasSidebar(categorias);
    } catch (error) {
        categoriasList.innerHTML = '<p>Error al cargar categorías.</p>';
        console.error(error);
    }
}

function renderizarCategoriasSidebar(categorias) {
    const categoriasList = document.getElementById('categorias-list');
    if (!categoriasList) return;

    if (!categorias || categorias.length === 0) {
        categoriasList.innerHTML = '<p>No hay categorías disponibles.</p>';
        return;
    }

    let categoriasHTML = '';
    categorias.forEach(categoria => {
        categoriasHTML += `<a href="#" class="categoria-item" data-id="${categoria.id}" data-nombre="${categoria.nombre}">${categoria.nombre}</a>`;
    });
    categoriasList.innerHTML = categoriasHTML;

    categoriasList.addEventListener('click', (e) => {
        e.preventDefault();
        const target = e.target;
        if (target.classList.contains('categoria-item')) {
            const categoryId = target.dataset.id;
            const categoryName = target.dataset.nombre;

            if (window.location.pathname.startsWith('/publicaciones')) {
                 const event = new CustomEvent('filterByCategory', {
                    detail: { categoryId: categoryId, categoryName: categoryName }
                 });
                 document.dispatchEvent(event);
            } else {
                 window.location.href = `/publicaciones/?categoria=${categoryId}`;
            }
        }
    });
}


document.addEventListener('DOMContentLoaded', () => {
    if (window.auth.isLoggedIn()) {
        renderizarComponentesDeUsuarioSidebar();
        cargarCategoriasSidebar();
    }
});
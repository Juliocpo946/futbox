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
    const categoriasList = document.getElementById('categorias-list');
    if (!categoriasList) return;
    try {
        const categorias = await window.api.fetchAPI('/publicaciones/categorias/');
        if (!categorias || categorias.length === 0) {
            categoriasList.innerHTML = '<p>No hay categorías disponibles.</p>';
            return;
        }
        let categoriasHTML = '';
        categorias.forEach(categoria => {
            categoriasHTML += `<a href="#" class="categoria-item">${categoria.nombre}</a>`;
        });
        categoriasList.innerHTML = categoriasHTML;
    } catch (error) {
        categoriasList.innerHTML = '<p>Error al cargar categorías.</p>';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    if (window.auth.isLoggedIn()) {
        renderizarComponentesDeUsuario();
        cargarCategorias();
    }
});
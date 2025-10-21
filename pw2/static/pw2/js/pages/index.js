document.addEventListener('DOMContentLoaded', async () => {
    if (!window.auth.isLoggedIn()) {
        window.auth.clearAuthData();
        window.location.replace('/login/');
        return;
    }

    const searchForm = document.getElementById('search-form-nav');
    const searchInput = document.getElementById('search-input-nav');
    if (searchForm) {
        searchForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const query = searchInput.value.trim();
            if (query) {
                sessionStorage.setItem('searchQuery', query);
                window.location.href = '/publicaciones/';
            }
        });
    }

    await renderizarComponentesDeUsuario();
    await cargarPublicacionesRecientes();
});

async function renderizarComponentesDeUsuario() {
    try {
        const user = await window.api.fetchAPI('/usuarios/perfil/');
        if (!user) return;

        const profileSection = document.getElementById('profile-section-authenticated');
        const unauthenticatedNav = document.getElementById('nav-unauthenticated');
        if (profileSection) profileSection.style.display = 'block';
        if (unauthenticatedNav) unauthenticatedNav.style.display = 'none';

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
        console.error('Error al cargar datos del usuario:', error);
        window.auth.clearAuthData();
        window.location.replace('/login/');
    }
}

async function cargarPublicacionesRecientes() {
    try {
        const publicaciones = await window.api.fetchAPI('/publicaciones/');
        const topPublicaciones = publicaciones.slice(0, 5);
        renderizarCarrusel(topPublicaciones);
    } catch (error) {
        console.error('Error al cargar publicaciones:', error);
        const carruselContainer = document.querySelector('.carrusel-contenedor');
        if (carruselContainer) {
            carruselContainer.innerHTML = '<p>No se pudieron cargar las publicaciones.</p>';
        }
    }
}

function renderizarCarrusel(publicaciones) {
    const carruselContainer = document.querySelector('.carrusel-contenedor');
    if (!carruselContainer) return;
    
    if (!publicaciones || publicaciones.length === 0) {
        carruselContainer.innerHTML = '<p>No hay publicaciones disponibles.</p>';
        return;
    }

    let carruselHTML = '<div class="carrusel-inner">';
    publicaciones.forEach((pub, index) => {
        const activeClass = index === 0 ? 'active' : '';
        const imagenUrl = pub.multimedia.length > 0 ? pub.multimedia[0].path : '/static/pw2/images/bluelock.jpg';
        carruselHTML += `
            <div class="carrusel-item ${activeClass}">
                <img src="${imagenUrl}" alt="${pub.titulo}">
                <div class="carrusel-caption">
                    <div class="captiontext">
                        <h3>${pub.titulo}</h3>
                        <p>${pub.descripcion.substring(0, 100)}...</p>
                    </div>
                    <a href="/publicaciones/${pub.id}/" class="botonleer">Leer mas</a>
                </div>
            </div>
        `;
    });
    carruselHTML += '</div>';
    carruselHTML += '<a class="prev" onclick="plusSlides(-1)">&#10094;</a><a class="next" onclick="plusSlides(1)">&#10095;</a>';
    carruselContainer.innerHTML = carruselHTML;
    
    if (typeof showSlides === "function") {
        showSlides(1);
    }
}
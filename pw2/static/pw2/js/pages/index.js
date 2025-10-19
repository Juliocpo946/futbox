document.addEventListener('DOMContentLoaded', async () => {
    // ACCIÓN #1: PROTEGER LA RUTA.
    // Si el usuario no está logueado, el script se detiene aquí y lo redirige.
    window.auth.protegerRuta();

    // El resto del código solo se ejecutará si el usuario SÍ está logueado.
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
    await cargarMundiales();
});

async function renderizarComponentesDeUsuario() {
    const user = window.auth.getUserData();
    if (!user) return;

    const profileSection = document.getElementById('profile-section-authenticated');
    const unauthenticatedNav = document.getElementById('nav-unauthenticated');
    if (profileSection) profileSection.style.display = 'block';
    if (unauthenticatedNav) unauthenticatedNav.style.display = 'none';

    document.getElementById('profile-name').textContent = user.nombre;
    document.getElementById('profile-nickname').textContent = `@${user.nickname}`;
    if (user.foto_perfil) {
        document.getElementById('profile-pic').src = user.foto_perfil;
    }

    const logoutBtn = document.getElementById('logout-button');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            window.auth.logout();
        });
    }
}

async function cargarPublicacionesRecientes() {
    try {
        const publicaciones = await window.api.fetchAPI('/publicaciones/');
        const topPublicaciones = publicaciones.slice(0, 5);
        renderizarCarrusel(topPublicaciones);
    } catch (error) {
        console.error('Error al cargar publicaciones:', error);
        document.querySelector('.carrusel-contenedor').innerHTML = '<p>No se pudieron cargar las publicaciones.</p>';
    }
}

function renderizarCarrusel(publicaciones) {
    const carruselContainer = document.querySelector('.carrusel-contenedor');
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
                    <a href="/publicaciones/${pub.id}/" class="botonleer">Leer más</a>
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

async function cargarMundiales() {
    try {
        const mundiales = await window.api.fetchAPI('/admin/mundiales/');
        renderizarMundiales(mundiales);
    } catch (error) {
        console.error('Error al cargar mundiales:', error);
        document.querySelector('.tarjetascontenedor').innerHTML = '<p>No se pudieron cargar los mundiales.</p>';
    }
}

function renderizarMundiales(mundiales) {
    const container = document.querySelector('.tarjetascontenedor');
    if (!mundiales || mundiales.length === 0) {
        container.innerHTML = '<p>No hay mundiales registrados.</p>';
        return;
    }

    container.innerHTML = '';
    mundiales.forEach(mundial => {
        const tarjeta = document.createElement('div');
        tarjeta.className = 'tarjeta';
        tarjeta.innerHTML = `
            <img src="/static/pw2/images/Mundial2026.png" alt="Mundial ${mundial.año}">
            <div class="tarjetainfo">
                <h3 class="tarjetatitulo">Mundial ${mundial.año}</h3>
                <p class="tarjetadescripcion">${mundial.descripcion}</p>
            </div>
        `;
        container.appendChild(tarjeta);
    });
}
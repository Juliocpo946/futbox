document.addEventListener('DOMContentLoaded', async () => {
    const searchForm = document.getElementById('search-form-nav');
    const searchInput = document.getElementById('search-input-nav');

    if (searchForm) {
        searchForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const query = searchInput.value.trim();
            if (query) {
                window.location.href = `/buscar/?q=${encodeURIComponent(query)}`;
            }
        });
    }

    if (!window.auth.isLoggedIn()) {
        document.getElementById('nav-unauthenticated').style.display = 'block';
    } else {
        await cargarDatosUsuario();
        await cargarPublicacionesRecientes();
        await cargarMundiales();
    }

    const logoutBtn = document.getElementById('logout-button');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            window.auth.logout();
        });
    }
});

async function cargarDatosUsuario() {
    try {
        const user = await window.api.fetchAPI('/usuarios/perfil/');
        const profileSection = document.getElementById('profile-section-authenticated');
        
        if (profileSection) {
            profileSection.style.display = 'block';
            document.getElementById('profile-name').textContent = user.nombre;
            document.getElementById('profile-nickname').textContent = `@${user.nickname}`;
            
            if (user.foto_perfil) {
                document.getElementById('profile-pic').src = user.foto_perfil;
            }
        }
    } catch (error) {
        console.error('Error al cargar datos del usuario:', error);
    }
}

async function cargarPublicacionesRecientes() {
    try {
        const publicaciones = await window.api.fetchAPI('/publicaciones/');
        const topPublicaciones = publicaciones.slice(0, 5);
        renderCarrusel(topPublicaciones);
    } catch (error) {
        console.error('Error al cargar publicaciones:', error);
    }
}

function renderCarrusel(publicaciones) {
    const carruselContainer = document.querySelector('.carrusel-contenedor');
    if (!publicaciones || publicaciones.length === 0) {
        carruselContainer.innerHTML = '<p>No hay publicaciones disponibles en este momento.</p>';
        return;
    }

    let carruselHTML = '<div class="carrusel-inner">';
    
    publicaciones.forEach((pub, index) => {
        const activeClass = index === 0 ? 'active' : '';
        const imagenUrl = pub.multimedia && pub.multimedia.length > 0 
            ? pub.multimedia[0].path 
            : '/static/pw2/images/default-post.jpg';
        
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
    carruselHTML += '<a class="prev" onclick="plusSlides(-1)">&#10094;</a>';
    carruselHTML += '<a class="next" onclick="plusSlides(1)">&#10095;</a>';
    
    carruselContainer.innerHTML = carruselHTML;
}

async function cargarMundiales() {
    try {
        const mundiales = await window.api.fetchAPI('/admin/mundiales/');
        renderMundiales(mundiales);
    } catch (error) {
        console.error('Error al cargar mundiales:', error);
    }
}

function renderMundiales(mundiales) {
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
            <img src="/static/pw2/images/mundial-${mundial.año}.jpg" 
                 alt="Mundial ${mundial.año}"
                 onerror="this.src='/static/pw2/images/default-mundial.jpg'">
            <div class="tarjetainfo">
                <h3 class="tarjetatitulo">Mundial ${mundial.año}</h3>
                <p class="tarjetadescripcion">${mundial.descripcion}</p>
            </div>
        `;
        
        container.appendChild(tarjeta);
    });
}
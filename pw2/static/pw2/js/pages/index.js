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
    await cargarMundiales();
    await cargarCategorias();
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

async function cargarMundiales() {
    const mundialesContainer = document.getElementById('mundiales-container');
    const modal = document.getElementById('mundial-modal');
    const modalClose = document.getElementById('mundial-modal-close');

    if (!mundialesContainer || !modal || !modalClose) {
        return;
    }

    try {
        const mundiales = await window.api.fetchAPI('/publicaciones/mundiales/');
        
        if (!mundiales || mundiales.length === 0) {
            mundialesContainer.innerHTML = '<p>No hay mundiales disponibles.</p>';
            return;
        }

        renderizarMundiales(mundiales);

        mundialesContainer.addEventListener('click', (e) => {
            const card = e.target.closest('.tarjeta');
            if (!card) return;

            const mundialId = parseInt(card.dataset.mundialId, 10);
            const mundialSeleccionado = mundiales.find(m => m.id === mundialId);

            if (mundialSeleccionado) {
                document.getElementById('mundial-modal-img').src = mundialSeleccionado.imagen?.path || '/static/pw2/images/Mundial2026.png';
                document.getElementById('mundial-modal-nombre').textContent = mundialSeleccionado.nombre || 'Mundial';
                document.getElementById('mundial-modal-año').textContent = mundialSeleccionado.año;
                document.getElementById('mundial-modal-sedes').textContent = mundialSeleccionado.sedes.map(s => s.pais).join(', ');
                document.getElementById('mundial-modal-descripcion').textContent = mundialSeleccionado.descripcion;
                
                modal.classList.add('is-visible');
            }
        });

        const cerrarModal = () => {
            modal.classList.remove('is-visible');
        };

        modalClose.addEventListener('click', cerrarModal);
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                cerrarModal();
            }
        });

    } catch (error) {
        mundialesContainer.innerHTML = '<p>No se pudieron cargar los mundiales.</p>';
    }
}

function renderizarMundiales(mundiales) {
    const mundialesContainer = document.getElementById('mundiales-container');
    if (!mundialesContainer) return;

    let mundialesHTML = '';
    mundiales.forEach(mundial => {
        const imagenUrl = mundial.imagen?.path || '/static/pw2/images/Mundial2026.png';
        mundialesHTML += `
            <div class="tarjeta" data-mundial-id="${mundial.id}">
                <img src="${imagenUrl}" alt="${mundial.nombre}">
                <div class="tarjetainfo">
                    <h3 class="tarjetatitulo">${mundial.nombre || `Mundial ${mundial.año}`}</h3>
                    <p class="tarjetadescripcion">${mundial.descripcion.substring(0, 100)}...</p>
                </div>
            </div>
        `;
    });
    mundialesContainer.innerHTML = mundialesHTML;
}

async function cargarCategorias() {
    const categoriasList = document.getElementById('categorias-list');
    try {
        const categorias = await window.api.fetchAPI('/publicaciones/categorias/');
        renderizarCategorias(categorias);
    } catch (error) {
        if (categoriasList) {
            categoriasList.innerHTML = '<p>No se pudieron cargar las categorías.</p>';
        }
    }
}

function renderizarCategorias(categorias) {
    const categoriasList = document.getElementById('categorias-list');
    if (!categoriasList) return;

    if (!categorias || categorias.length === 0) {
        categoriasList.innerHTML = '<p>No hay categorías disponibles.</p>';
        return;
    }

    let categoriasHTML = '';
    categorias.forEach(categoria => {
        categoriasHTML += `<a href="#" class="categoria-item">${categoria.nombre}</a>`;
    });
    categoriasList.innerHTML = categoriasHTML;
}
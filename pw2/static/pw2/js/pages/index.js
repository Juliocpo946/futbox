document.addEventListener('DOMContentLoaded', async () => {
    if (!window.auth.isLoggedIn()) {
        window.auth.clearAuthData();
        window.location.replace('/login/');
        return;
    }

    const searchForm = document.getElementById('search-form-nav');
    const searchInput = document.getElementById('search-input-nav');
    const mundialFilterSelect = document.getElementById('mundial-filter-nav');

    async function cargarMundialesSelect() {
        if (!mundialFilterSelect) return;
        try {
            const mundiales = await window.api.fetchAPI('/publicaciones/mundiales/');
            mundiales.sort((a, b) => b.año - a.año);
            mundiales.forEach(mundial => {
                const option = document.createElement('option');
                option.value = mundial.id;
                option.textContent = mundial.nombre ? `${mundial.nombre} (${mundial.año})` : `Mundial ${mundial.año}`;
                mundialFilterSelect.appendChild(option);
            });
        } catch (error) {
            console.error("Error al cargar mundiales para filtro:", error);
        }
    }

    function irAPublicacionesConFiltros(search = '', mundialId = '', categoriaId = '') {
        const params = new URLSearchParams();
        if (search) params.set('search', search);
        if (mundialId) params.set('mundial', mundialId);
        if (categoriaId) params.set('categoria', categoriaId);
        window.location.href = `/publicaciones/?${params.toString()}`;
    }

    if (searchForm && searchInput) {
        searchForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const query = searchInput.value.trim();
            const mundialId = mundialFilterSelect ? mundialFilterSelect.value : '';
            irAPublicacionesConFiltros(query, mundialId);
        });
    }

    if(mundialFilterSelect) {
        mundialFilterSelect.addEventListener('change', (e) => {
            const mundialId = e.target.value;
            const query = searchInput ? searchInput.value.trim() : '';
            irAPublicacionesConFiltros(query, mundialId);
        });
    }

    document.addEventListener('filterByCategory', (event) => {
        irAPublicacionesConFiltros('', '', event.detail.categoryId);
    });

    await renderizarComponentesDeUsuario();
    await cargarPublicacionesRecientes();
    await cargarMundiales();
    await cargarMundialesSelect();
});


async function renderizarComponentesDeUsuario() {
    try {
        const user = await window.api.fetchAPI('/usuarios/perfil/');
        if (!user) return;

        const profileName = document.getElementById('profile-name');
        const profileNickname = document.getElementById('profile-nickname');
        const profilePicContainer = document.getElementById('sidebar-profile-pic-container'); // Usar contenedor
        const logoutBtn = document.getElementById('logout-button');

        if(profileName) profileName.textContent = user.nombre;
        if(profileNickname) profileNickname.textContent = `@${user.nickname}`;

        if (profilePicContainer) { // Actualizar contenedor
             if (user.foto_perfil) {
                profilePicContainer.innerHTML = `<img id="profile-pic" src="${user.foto_perfil}" alt="Foto de perfil">`;
             } else {
                profilePicContainer.innerHTML = `<i class="fas fa-user-circle profile-placeholder-icon"></i>`;
             }
        }

        if (logoutBtn) {
            logoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                window.auth.logout();
            });
        }
         const unauthenticatedNav = document.getElementById('nav-unauthenticated');
         if (unauthenticatedNav) unauthenticatedNav.style.display = 'none';

    } catch (error) {
         console.error("Error cargando perfil, redirigiendo a login:", error);
        window.auth.clearAuthData();
        if (window.location.pathname !== '/login/') {
             window.location.replace('/login/');
        }

    }
}

async function cargarPublicacionesRecientes() {
    const carruselContainer = document.querySelector('.carrusel-contenedor');
    if (!carruselContainer) return;
    try {
        const publicaciones = await window.api.fetchAPI('/publicaciones/?limit=5');
        const topPublicaciones = publicaciones.slice(0, 5);
        renderizarCarrusel(topPublicaciones);
    } catch (error) {
        carruselContainer.innerHTML = '<p>No se pudieron cargar las publicaciones recientes.</p>';
        console.error(error);
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
        const imagenUrl = pub.multimedia.length > 0 ? pub.multimedia[0].path : null; // Obtener URL o null
        const mediaElement = imagenUrl
            ? `<img src="${imagenUrl}" alt="${pub.titulo}">`
            : `<span class="media-placeholder-icon"><i class="far fa-image"></i></span>`; // Icono si no hay imagen

        carruselHTML += `
            <div class="carrusel-item ${activeClass}">
                ${mediaElement}
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
    if(publicaciones.length > 1) {
       carruselHTML += '<a class="prev" onclick="plusSlides(-1)">&#10094;</a><a class="next" onclick="plusSlides(1)">&#10095;</a>';
    }

    carruselContainer.innerHTML = carruselHTML;

    if (typeof showSlides === "function" && publicaciones.length > 0) {
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

         mundiales.sort((a, b) => b.año - a.año);
        renderizarMundiales(mundiales);

        mundialesContainer.addEventListener('click', (e) => {
            const card = e.target.closest('.tarjeta');
            if (!card) return;

            const mundialId = parseInt(card.dataset.mundialId, 10);
            const mundialSeleccionado = mundiales.find(m => m.id === mundialId);

            if (mundialSeleccionado) {
                 const imgModal = document.getElementById('mundial-modal-img');
                 const nombreModal = document.getElementById('mundial-modal-nombre');
                 const anioModal = document.getElementById('mundial-modal-año');
                 const sedesModal = document.getElementById('mundial-modal-sedes');
                 const descModal = document.getElementById('mundial-modal-descripcion');
                 const imgContainerModal = document.querySelector('.mundial-modal-col-30'); // Contenedor de imagen

                 if (imgContainerModal) {
                      if (mundialSeleccionado.imagen?.path) {
                           imgContainerModal.innerHTML = `<img id="mundial-modal-img" src="${mundialSeleccionado.imagen.path}" alt="Imagen del Mundial">`;
                      } else {
                           imgContainerModal.innerHTML = `<span class="media-placeholder-icon" style="font-size: 60px;"><i class="fas fa-trophy"></i></span>`; // Icono trofeo
                      }
                 }


                 if(nombreModal) nombreModal.textContent = mundialSeleccionado.nombre || `Mundial ${mundialSeleccionado.año}`;
                 if(anioModal) anioModal.textContent = mundialSeleccionado.año;
                 if(sedesModal) sedesModal.textContent = mundialSeleccionado.sedes.map(s => s.pais).join(', ') || 'N/A';
                 if(descModal) descModal.textContent = mundialSeleccionado.descripcion;

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
        if (mundialesContainer) mundialesContainer.innerHTML = '<p>No se pudieron cargar los mundiales.</p>';
        console.error(error);
    }
}

function renderizarMundiales(mundiales) {
    const mundialesContainer = document.getElementById('mundiales-container');
    if (!mundialesContainer) return;

    let mundialesHTML = '';
    mundiales.forEach(mundial => {
        const imagenHTML = mundial.imagen?.path
            ? `<img src="${mundial.imagen.path}" alt="${mundial.nombre || `Mundial ${mundial.año}`}">`
            : `<div class="tarjeta-img-placeholder"><i class="fas fa-trophy"></i></div>`; // Icono placeholder

        mundialesHTML += `
            <div class="tarjeta" data-mundial-id="${mundial.id}">
                ${imagenHTML}
                <div class="tarjetainfo">
                    <h3 class="tarjetatitulo">${mundial.nombre || `Mundial ${mundial.año}`}</h3>
                    <p class="tarjetadescripcion">${mundial.descripcion.substring(0, 100)}...</p>
                </div>
            </div>
        `;
    });
    mundialesContainer.innerHTML = mundialesHTML;

     // Estilos para el placeholder de la tarjeta de mundial
     if(!document.head.querySelector('style[data-mundial-placeholder]')) {
         const style = document.createElement('style');
         style.setAttribute('data-mundial-placeholder', 'true');
         style.textContent = `
            .tarjeta-img-placeholder {
                width: 100%; height: 160px; background-color: #e0e0e0;
                display: flex; justify-content: center; align-items: center; }
            .tarjeta-img-placeholder i { font-size: 50px; color: #b0b0b0; }
         `;
         document.head.appendChild(style);
    }
}
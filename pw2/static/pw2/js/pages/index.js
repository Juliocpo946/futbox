document.addEventListener('DOMContentLoaded', async () => {
    if (!window.auth.isLoggedIn()) {
        window.auth.clearAuthData();
        window.location.replace('/login/');
        return;
    }

    const filtros = new window.FiltrosPublicaciones({
        tituloSeccionId: null,
        onFilterChange: (endpoint) => {
            const params = new URLSearchParams(endpoint.split('?')[1]);
            window.location.href = `/publicaciones/?${params.toString()}`;
        }
    });

    await window.inicializarBarraNavegacion();
    await cargarPublicacionesRecientes();
    await cargarMundiales();
});

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
        const firstImage = pub.multimedia.find(m => m.media_type === 'image');
        const imagenUrl = firstImage ? firstImage.path : null;

        const mediaElement = imagenUrl
            ? `<img src="${imagenUrl}" alt="${pub.titulo}">`
            : `<span class="media-placeholder-icon"><i class="far fa-image"></i></span>`;

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
    if (publicaciones.length > 1) {
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

    if (!mundialesContainer || !modal || !modalClose) return;

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
                const imgContainerModal = document.querySelector('.mundial-modal-col-30');
                const nombreModal = document.getElementById('mundial-modal-nombre');
                const anioModal = document.getElementById('mundial-modal-año');
                const sedesModal = document.getElementById('mundial-modal-sedes');
                const descModal = document.getElementById('mundial-modal-descripcion');

                if (imgContainerModal) {
                    if (mundialSeleccionado.imagen?.path) {
                        imgContainerModal.innerHTML = `<img id="mundial-modal-img" src="${mundialSeleccionado.imagen.path}" alt="Imagen del Mundial">`;
                    } else {
                        imgContainerModal.innerHTML = `<span class="media-placeholder-icon" style="font-size: 60px;"><i class="fas fa-trophy"></i></span>`;
                    }
                }

                if (nombreModal) nombreModal.textContent = mundialSeleccionado.nombre || `Mundial ${mundialSeleccionado.año}`;
                if (anioModal) anioModal.textContent = mundialSeleccionado.año;
                if (sedesModal) sedesModal.textContent = mundialSeleccionado.sedes.map(s => s.pais).join(', ') || 'N/A';
                if (descModal) descModal.textContent = mundialSeleccionado.descripcion;

                modal.classList.add('is-visible');
            }
        });

        const cerrarModal = () => modal.classList.remove('is-visible');
        modalClose.addEventListener('click', cerrarModal);
        modal.addEventListener('click', (e) => {
            if (e.target === modal) cerrarModal();
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
            : `<div class="tarjeta-img-placeholder"><i class="fas fa-trophy"></i></div>`;

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

    if (!document.head.querySelector('style[data-mundial-placeholder]')) {
        const style = document.createElement('style');
        style.setAttribute('data-mundial-placeholder', 'true');
        style.textContent = `
            .tarjeta-img-placeholder {
                width: 100%; height: 160px; background-color: #e0e0e0;
                display: flex; justify-content: center; align-items: center;
            }
            .tarjeta-img-placeholder i { font-size: 70px; color: #b0b0b0; }
        `;
        document.head.appendChild(style);
    }
}
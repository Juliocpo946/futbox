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
        const firstVideo = !firstImage ? pub.multimedia.find(m => m.media_type === 'video') : null;

        let mediaElement = '';
        if (firstImage) {
            mediaElement = `<img src="${firstImage.path}" alt="${pub.titulo}">`;
        } else if (firstVideo) {
            mediaElement = `<video src="${firstVideo.path}" muted loop autoplay playsinline alt="${pub.titulo}"></video>`;
        } else {
            mediaElement = `<span class="media-placeholder-icon"><i class="far fa-image"></i></span>`;
        }

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
    const modalMediaContainer = document.getElementById('mundial-modal-media-carousel-container');

    if (!mundialesContainer || !modal || !modalClose || !modalMediaContainer) return;

    let currentModalIndex = 0;
    let currentModalMedia = [];

    function renderModalCarousel(index) {
        if (!currentModalMedia || currentModalMedia.length === 0) {
             modalMediaContainer.innerHTML = `<span class="media-placeholder-icon"><i class="fas fa-trophy"></i></span>`;
             return;
        }
        currentModalIndex = index;
        const item = currentModalMedia[index];
        let mediaElementHTML = '';

        if (item.media_type === 'image') {
            mediaElementHTML = `<img src="${item.path}" alt="Slide ${index + 1}">`;
        } else if (item.media_type === 'video') {
            mediaElementHTML = `<video controls muted><source src="${item.path}" type="${item.path.endsWith('mp4') ? 'video/mp4' : item.path.endsWith('webm') ? 'video/webm' : 'video/ogg'}">Video no soportado.</video>`;
        } else {
            mediaElementHTML = `<span class="media-placeholder-icon"><i class="fas fa-ban"></i></span>`;
        }

        modalMediaContainer.innerHTML = `
            <div class="media-carousel-inner" style="transform: translateX(-${index * 100}%);">
                ${currentModalMedia.map((media, i) => `
                    <div class="media-carousel-item ${i === index ? 'active' : ''}" style="min-width: 100%;">
                        ${i === index ? mediaElementHTML : ''}
                    </div>
                `).join('')}
            </div>
             ${currentModalMedia.length > 1 ? `
                <button class="media-carousel-control prev" ${index === 0 ? 'disabled' : ''}>&#10094;</button>
                <button class="media-carousel-control next" ${index === currentModalMedia.length - 1 ? 'disabled' : ''}>&#10095;</button>
                <div class="media-carousel-indicators">
                    ${currentModalMedia.map((_, i) => `<button class="media-carousel-indicator ${i === index ? 'active' : ''}" data-slide-to="${i}"></button>`).join('')}
                </div>
             ` : ''}
        `;

        modalMediaContainer.querySelector('.prev')?.addEventListener('click', () => renderModalCarousel(currentModalIndex - 1));
        modalMediaContainer.querySelector('.next')?.addEventListener('click', () => renderModalCarousel(currentModalIndex + 1));
        modalMediaContainer.querySelectorAll('.media-carousel-indicator').forEach(indicator => {
            indicator.addEventListener('click', (e) => renderModalCarousel(parseInt(e.target.dataset.slideTo, 10)));
        });
        
        const video = modalMediaContainer.querySelector('video');
        if(video && index !== currentModalIndex) {
            video.pause();
        }
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
                const nombreModal = document.getElementById('mundial-modal-nombre');
                const anioModal = document.getElementById('mundial-modal-año');
                const sedesModal = document.getElementById('mundial-modal-sedes');
                const descModal = document.getElementById('mundial-modal-descripcion');

                currentModalMedia = mundialSeleccionado.multimedia || [];
                renderModalCarousel(0);


                if (nombreModal) nombreModal.textContent = mundialSeleccionado.nombre || `Mundial ${mundialSeleccionado.año}`;
                if (anioModal) anioModal.textContent = mundialSeleccionado.año;
                if (sedesModal) sedesModal.textContent = mundialSeleccionado.sedes.map(s => s.pais).join(', ') || 'N/A';
                if (descModal) descModal.textContent = mundialSeleccionado.descripcion;

                modal.classList.remove('modal-oculto');
                modal.classList.add('modal-visible');
            }
        });

        const cerrarModal = () => {
            modal.classList.remove('modal-visible');
            modal.classList.add('modal-oculto');
            modalMediaContainer.innerHTML = ''; 
            currentModalMedia = [];
            currentModalIndex = 0;
            const videoElement = modal.querySelector('video');
             if(videoElement) {
                videoElement.pause();
                videoElement.removeAttribute('src');
                videoElement.load();
             }
        };
        modalClose.addEventListener('click', cerrarModal);
        modal.addEventListener('click', (e) => {
            if (e.target === modal) cerrarModal();
        });

    } catch (error) {
        if (mundialesContainer) mundialesContainer.innerHTML = '<p>No se pudieron cargar los mundiales.</p>';

    }
}

function renderizarMundiales(mundiales) {
    const mundialesContainer = document.getElementById('mundiales-container');
    if (!mundialesContainer) return;

    let mundialesHTML = '';
    mundiales.forEach(mundial => {
        let imagenHTML = `<div class="tarjeta-img-placeholder"><i class="fas fa-trophy"></i></div>`;
        if (mundial.multimedia && mundial.multimedia.length > 0) {
            const firstMedia = mundial.multimedia[0];
             if (firstMedia.media_type === 'image') {
                imagenHTML = `<img src="${firstMedia.path}" alt="${mundial.nombre || `Mundial ${mundial.año}`}">`;
             } else if (firstMedia.media_type === 'video') {
                imagenHTML = `<video src="${firstMedia.path}#t=0.5" muted preload="metadata" style="width:100%; height: 200px; object-fit: cover;"></video>`;
            }
        }


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
}

const style = document.createElement('style');
style.innerHTML = `
    #mundial-modal-media-carousel-container { position: relative; width: 100%; max-height: 40vh; overflow: hidden; display: flex; justify-content: center; align-items: center; background-color: #f0f2f5; border-radius: 8px; }
    #mundial-modal-media-carousel-container .media-carousel-inner { display: flex; width: 100%; height: 100%; transition: transform 0.5s ease; align-items: center; }
    #mundial-modal-media-carousel-container .media-carousel-item { min-width: 100%; height: 100%; display: flex; justify-content: center; align-items: center; }
    #mundial-modal-media-carousel-container img, #mundial-modal-media-carousel-container video { width: auto; height: auto; max-width: 100%; max-height: 40vh; object-fit: contain; display: block; }
    #mundial-modal-media-carousel-container .media-carousel-control { position: absolute; top: 50%; transform: translateY(-50%); background-color: rgba(0, 0, 0, 0.4); color: white; border: none; border-radius: 50%; width: 30px; height: 30px; font-size: 16px; cursor: pointer; z-index: 10; display: flex; align-items: center; justify-content: center; }
    #mundial-modal-media-carousel-container .media-carousel-control.prev { left: 10px; }
    #mundial-modal-media-carousel-container .media-carousel-control.next { right: 10px; }
    #mundial-modal-media-carousel-container .media-carousel-control:disabled { opacity: 0.3; cursor: not-allowed; }
    #mundial-modal-media-carousel-container .media-carousel-indicators { position: absolute; bottom: 10px; left: 50%; transform: translateX(-50%); display: flex; gap: 5px; z-index: 10; }
    #mundial-modal-media-carousel-container .media-carousel-indicator { width: 8px; height: 8px; background-color: rgba(255, 255, 255, 0.5); border-radius: 50%; cursor: pointer; border: none; padding: 0; }
    #mundial-modal-media-carousel-container .media-carousel-indicator.active { background-color: white; }
    #mundial-modal-media-carousel-container .media-placeholder-icon { font-size: 60px; color: #b0b0b0; }
`;
document.head.appendChild(style);
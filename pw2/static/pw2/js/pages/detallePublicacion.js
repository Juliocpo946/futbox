document.addEventListener('DOMContentLoaded', async () => {
    window.auth.protectRoute();

    const container = document.getElementById('detalle-container');
    const publicacionId = PUBLICACION_ID;
    let comentariosCache = [];
    let ultimoComentarioId = 0;
    let pollingIntervalId = null;

    const filtros = new window.FiltrosPublicaciones({
        tituloSeccionId: null,
        onFilterChange: (endpoint) => {
            stopPolling();
            const params = new URLSearchParams(endpoint.split('?')[1]);
            window.location.href = `/publicaciones/?${params.toString()}`;
        }
    });

    async function cargarDetalleCompleto() {
        try {
            const publicacion = await window.api.fetchAPI(`/publicaciones/${publicacionId}/`);
            renderizarDetalle(publicacion);
            initializeDetailCarousel();
            configurarBotonReaccion(publicacion.reacciones_count);
            await cargarNuevosComentarios(true);

        } catch (error) {
            if (container) container.innerHTML = `<p>Error al cargar la publicación.</p>`;
            console.error(error);
        }
    }
    
    async function cargarNuevosComentarios(inicial = false) {
        const listaComentarios = document.getElementById('comentarios-lista');
        if (!listaComentarios && !inicial) return;
        
        let endpoint = `/publicaciones/${publicacionId}/comentarios/`;
        if (!inicial && ultimoComentarioId > 0) {
             endpoint += `?since_id=${ultimoComentarioId}`;
        }
        
        try {
            const nuevosComentarios = await window.api.fetchAPI(endpoint);
            
            if (inicial) {
                comentariosCache = nuevosComentarios;
                renderizarComentarios(comentariosCache);
            } else if (nuevosComentarios.length > 0) {
                nuevosComentarios.forEach(com => {
                    if (!comentariosCache.some(c => c.id === com.id)) {
                        anadirComentarioALista(com);
                        comentariosCache.push(com);
                    }
                });
            }
            
            if (comentariosCache.length > 0) {
                ultimoComentarioId = comentariosCache[comentariosCache.length - 1].id;
            }

            if (inicial && !pollingIntervalId) {
                startPolling();
            }
            
        } catch (error) {
            console.error("Error al cargar comentarios:", error);
            if (inicial && listaComentarios) listaComentarios.innerHTML = '<p>Error al cargar comentarios.</p>';
        }
    }


    function renderizarDetalle(pub) {
        if (!container) return;
        const fechaPub = new Date(pub.fecha_publicacion).toLocaleString('es-ES', { dateStyle: 'long', timeStyle: 'short' });
        const profilePicHTML = pub.autor.foto_perfil ? `<img class="autor-pic" src="${pub.autor.foto_perfil}" alt="Foto de perfil">` : `<i class="fas fa-user-circle profile-placeholder-icon"></i>`;

        let multimediaHTML = '';
        if (pub.multimedia && pub.multimedia.length > 0) {
            if (pub.multimedia.length === 1) {
                const item = pub.multimedia[0];
                if (item.media_type === 'image') multimediaHTML = `<div class="detalle-multimedia"><img src="${item.path}" alt="${pub.titulo}"></div>`;
                else if (item.media_type === 'video') multimediaHTML = `<div class="detalle-multimedia"><video controls><source src="${item.path}" type="video/mp4"></video></div>`;
                else multimediaHTML = `<div class="detalle-multimedia media-placeholder-icon"><i class="fas fa-ban"></i></div>`;
            } else {
                multimediaHTML = `
                    <div class="detalle-multimedia">
                        <div class="media-carousel" id="carousel-detail-${pub.id}">
                            <div class="media-carousel-inner">
                                ${pub.multimedia.map((item, index) => `<div class="media-carousel-item ${index === 0 ? 'active' : ''}">${item.media_type === 'image' ? `<img src="${item.path}" alt="Slide ${index + 1}">` : item.media_type === 'video' ? `<video controls><source src="${item.path}" type="video/mp4"></video>` : `<span class="media-placeholder-icon"><i class="fas fa-ban"></i></span>`}</div>`).join('')}
                            </div>
                            ${pub.multimedia.length > 1 ? `<button class="media-carousel-control prev" data-carousel-id="carousel-detail-${pub.id}" data-slide="prev">&#10094;</button><button class="media-carousel-control next" data-carousel-id="carousel-detail-${pub.id}" data-slide="next">&#10095;</button><div class="media-carousel-indicators">${pub.multimedia.map((_, index) => `<button class="media-carousel-indicator ${index === 0 ? 'active' : ''}" data-carousel-id="carousel-detail-${pub.id}" data-slide-to="${index}"></button>`).join('')}</div>` : ''}
                        </div>
                    </div>`;
            }
        } else {
            multimediaHTML = `<div class="detalle-multimedia media-placeholder-icon"><i class="far fa-image"></i></div>`;
        }

        container.innerHTML = `
            <div class="detalle-publicacion-card">
                <div class="detalle-header">${profilePicHTML}<div class="detalle-autor"><span class="nombre">${pub.autor.nombre}</span><p class="fecha"><a href="/perfil/${pub.autor.nickname}/">@${pub.autor.nickname}</a> - ${fechaPub}</p></div></div>
                <div class="detalle-body"><h1>${pub.titulo}</h1><p class="descripcion">${pub.descripcion.replace(/\n/g, '<br>')}</p>${multimediaHTML}</div>
                <div class="detalle-footer"><button class="reaccion-btn" id="reaccion-btn"><i class="fas fa-heart"></i><span id="reaccion-count">${pub.reacciones_count}</span></button></div>
            </div>
            <div class="comentarios-section" id="comentarios-section"><h2>Comentarios</h2><form class="nuevo-comentario-form" id="comentario-form"><textarea id="comentario-texto" placeholder="Escribe tu comentario..." required></textarea><button type="submit">Comentar</button></form><div id="comentarios-lista"><p>Cargando comentarios...</p></div></div>`;
        
        configurarFormularioComentario();
    }

    function initializeDetailCarousel() {
        const carouselElement = container.querySelector('.media-carousel');
        if (!carouselElement) return;
        const inner = carouselElement.querySelector('.media-carousel-inner');
        const items = carouselElement.querySelectorAll('.media-carousel-item');
        const indicators = carouselElement.querySelectorAll('.media-carousel-indicator');
        const totalItems = items.length;
        if (totalItems <= 1) return;
        let currentIndex = 0;

        function updateCarousel(newIndex) {
            currentIndex = newIndex;
            if (inner) inner.style.transform = `translateX(-${currentIndex * 100}%)`;
            indicators.forEach((indicator, index) => indicator.classList.toggle('active', index === currentIndex));
            items.forEach((item, index) => {
                const video = item.querySelector('video');
                if (video && index !== currentIndex) video.pause();
            });
        }

        carouselElement.addEventListener('click', (e) => {
            const target = e.target.closest('.media-carousel-control, .media-carousel-indicator');
            if (!target) return;
            let newIndex = currentIndex;
            if (target.matches('[data-slide="next"]')) newIndex = (currentIndex + 1) % totalItems;
            else if (target.matches('[data-slide="prev"]')) newIndex = (currentIndex - 1 + totalItems) % totalItems;
            else if (target.matches('[data-slide-to]')) {
                const slideTo = parseInt(target.dataset.slideTo, 10);
                if (!isNaN(slideTo)) newIndex = slideTo;
            }
            if (newIndex !== currentIndex) updateCarousel(newIndex);
        });
    }

    function renderizarComentarios(comentarios) {
        const listaComentarios = document.getElementById('comentarios-lista');
        if (!listaComentarios) return;
        listaComentarios.innerHTML = '';
        if (!comentarios || comentarios.length === 0) {
            listaComentarios.innerHTML = '<p>No hay comentarios.</p>';
            return;
        }
        comentarios.forEach(com => anadirComentarioALista(com));
    }

    function anadirComentarioALista(com) {
        const listaComentarios = document.getElementById('comentarios-lista');
        if (!listaComentarios) return;
        const placeholder = listaComentarios.querySelector('p');
        if (placeholder && (placeholder.textContent.includes('No hay comentarios') || placeholder.textContent.includes('Cargando comentarios'))) {
            listaComentarios.innerHTML = '';
        }

        const profilePicHTML = com.usuario.foto_perfil ? `<img src="${com.usuario.foto_perfil}" alt="Foto" style="width: 30px; height: 30px; border-radius: 50%;">` : `<i class="fas fa-user-circle profile-placeholder-icon" style="font-size: 30px;"></i>`;
        const fechaCom = new Date(com.fecha_creacion).toLocaleString('es-ES', { dateStyle: 'medium', timeStyle: 'short' });
        const comentarioCard = document.createElement('div');
        comentarioCard.className = 'comentario-card';
        comentarioCard.innerHTML = `<div class="comentario-header">${profilePicHTML}<div class="comentario-autor-info"><strong><a href="/perfil/${com.usuario.nickname}/">@${com.usuario.nickname}</a></strong><span>- ${fechaCom}</span></div></div><div class="comentario-body"><p>${com.comentario.replace(/\n/g, '<br>')}</p></div>`;
        listaComentarios.appendChild(comentarioCard);
    }

    function configurarFormularioComentario() {
        const form = document.getElementById('comentario-form');
        const textarea = document.getElementById('comentario-texto');
        if (!form || !textarea) return;

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const texto = textarea.value.trim();
            if (!texto) return;
            const boton = form.querySelector('button');
            try {
                if (boton) { boton.disabled = true; boton.textContent = 'Enviando...'; }
                const nuevoComentario = await window.api.fetchAPI(`/publicaciones/${publicacionId}/comentarios/`, {
                    method: 'POST',
                    body: JSON.stringify({ comentario: texto }),
                });
                textarea.value = '';
                if (!comentariosCache.some(c => c.id === nuevoComentario.id)) {
                    anadirComentarioALista(nuevoComentario);
                    comentariosCache.push(nuevoComentario);
                     if (comentariosCache.length > 0) {
                        ultimoComentarioId = comentariosCache[comentariosCache.length - 1].id;
                    }
                }
            } catch (error) {
                alert('Error al enviar el comentario.');
            } finally {
                if (boton) { boton.disabled = false; boton.textContent = 'Comentar'; }
            }
        });
    }

    function configurarBotonReaccion(initialCount) {
        const btn = document.getElementById('reaccion-btn');
        const countSpan = document.getElementById('reaccion-count');
        if (!btn || !countSpan) return;
        let currentCount = initialCount;

        btn.addEventListener('click', async () => {
            try {
                btn.disabled = true;
                const resultado = await window.api.fetchAPI(`/publicaciones/${publicacionId}/reaccionar/`, { method: 'POST' });
                if (resultado.status === 'reaccion_creada') { currentCount++; btn.classList.add('reaccionado'); }
                else if (resultado.status === 'reaccion_eliminada') { currentCount = Math.max(0, currentCount - 1); btn.classList.remove('reaccionado'); }
                countSpan.textContent = currentCount;
            } catch (error) {
                alert('Error al procesar la reacción.');
            } finally {
                btn.disabled = false;
            }
        });
    }
    
    function startPolling() {
        stopPolling();
        pollingIntervalId = setInterval(cargarNuevosComentarios, 15000);
    }

    function stopPolling() {
        if (pollingIntervalId) {
            clearInterval(pollingIntervalId);
            pollingIntervalId = null;
        }
    }

    await window.inicializarBarraNavegacion();
    await cargarDetalleCompleto();
    
    window.addEventListener('beforeunload', stopPolling);
});
document.addEventListener('DOMContentLoaded', async () => {
    window.auth.protectRoute();

    const container = document.getElementById('detalle-container');
    const publicacionId = PUBLICACION_ID;

    async function cargarDetalleCompleto() {
        try {
            const [publicacion, comentarios] = await Promise.all([
                window.api.fetchAPI(`/publicaciones/${publicacionId}/`),
                window.api.fetchAPI(`/publicaciones/${publicacionId}/comentarios/`)
            ]);

            renderizarDetalle(publicacion);
            initializeDetailCarousel();
            renderizarComentarios(comentarios);
            configurarFormularioComentario();
            configurarBotonReaccion(publicacion.reacciones_count);

        } catch (error) {
            if(container) container.innerHTML = `<p>Error al cargar la publicación. Es posible que no exista o haya sido eliminada.</p>`;
            console.error(error);
        }
    }

    function renderizarDetalle(pub) {
         if (!container) return;
        const fechaPub = new Date(pub.fecha_publicacion).toLocaleString('es-ES', { dateStyle: 'long', timeStyle: 'short' });

        const profilePicHTML = pub.autor.foto_perfil
            ? `<img class="autor-pic" src="${pub.autor.foto_perfil}" alt="Foto de perfil">`
            : `<i class="fas fa-user-circle profile-placeholder-icon"></i>`;


        let multimediaHTML = '';
        if (pub.multimedia && pub.multimedia.length > 0) {
             if (pub.multimedia.length === 1) {
                    const item = pub.multimedia[0];
                    if (item.media_type === 'image') {
                        multimediaHTML = `<div class="detalle-multimedia"><img src="${item.path}" alt="${pub.titulo}"></div>`;
                    } else if (item.media_type === 'video') {
                        multimediaHTML = `<div class="detalle-multimedia"><video controls><source src="${item.path}" type="video/mp4">Tu navegador no soporta videos.</video></div>`;
                    } else {
                         multimediaHTML = `<div class="detalle-multimedia media-placeholder-icon"><i class="fas fa-ban"></i></div>`;
                    }
                } else {
                    multimediaHTML = `
                        <div class="detalle-multimedia">
                            <div class="media-carousel" id="carousel-detail-${pub.id}">
                                <div class="media-carousel-inner">
                                    ${pub.multimedia.map((item, index) => `
                                        <div class="media-carousel-item ${index === 0 ? 'active' : ''}">
                                            ${item.media_type === 'image'
                                                ? `<img src="${item.path}" alt="Slide ${index + 1}">`
                                                : item.media_type === 'video'
                                                ? `<video controls><source src="${item.path}" type="video/mp4">Video no soportado.</video>`
                                                : `<span class="media-placeholder-icon"><i class="fas fa-ban"></i></span>`}
                                        </div>
                                    `).join('')}
                                </div>
                                ${pub.multimedia.length > 1 ? `
                                <button class="media-carousel-control prev" data-carousel-id="carousel-detail-${pub.id}" data-slide="prev">&#10094;</button>
                                <button class="media-carousel-control next" data-carousel-id="carousel-detail-${pub.id}" data-slide="next">&#10095;</button>
                                <div class="media-carousel-indicators">
                                    ${pub.multimedia.map((_, index) => `<button class="media-carousel-indicator ${index === 0 ? 'active' : ''}" data-carousel-id="carousel-detail-${pub.id}" data-slide-to="${index}"></button>`).join('')}
                                </div>
                                ` : ''}
                            </div>
                        </div>
                    `;
                }
        } else {
             multimediaHTML = `<div class="detalle-multimedia media-placeholder-icon"><i class="far fa-image"></i></div>`;
        }

        container.innerHTML = `
            <div class="detalle-publicacion-card">
                <div class="detalle-header">
                    ${profilePicHTML}
                    <div class="detalle-autor">
                        <span class="nombre">${pub.autor.nombre}</span>
                        <p class="fecha"><a href="/perfil/${pub.autor.nickname}/">@${pub.autor.nickname}</a> - ${fechaPub}</p>
                    </div>
                </div>
                <div class="detalle-body">
                    <h1>${pub.titulo}</h1>
                    <p class="descripcion">${pub.descripcion.replace(/\n/g, '<br>')}</p>
                    ${multimediaHTML}
                </div>
                <div class="detalle-footer">
                    <button class="reaccion-btn" id="reaccion-btn">
                        <i class="fas fa-heart"></i>
                        <span id="reaccion-count">${pub.reacciones_count}</span>
                    </button>
                </div>
            </div>
            <div class="comentarios-section" id="comentarios-section">
                <h2>Comentarios</h2>
                <form class="nuevo-comentario-form" id="comentario-form">
                    <textarea id="comentario-texto" placeholder="Escribe tu comentario..." required></textarea>
                    <button type="submit">Comentar</button>
                </form>
                <div id="comentarios-lista">
                    <p>Cargando comentarios...</p>
                </div>
            </div>
        `;
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
            
            if (inner) {
                inner.style.transform = `translateX(-${currentIndex * 100}%)`;
            }
            
            indicators.forEach((indicator, index) => {
                indicator.classList.toggle('active', index === currentIndex);
            });

            items.forEach((item, index) => {
                const video = item.querySelector('video');
                if (video && index !== currentIndex) {
                    video.pause();
                }
            });
        }

        carouselElement.addEventListener('click', (e) => {
            const target = e.target.closest('.media-carousel-control, .media-carousel-indicator');
            if (!target) return;

            let newIndex = currentIndex;
            
            if (target.matches('[data-slide="next"]')) {
                newIndex = (currentIndex + 1) % totalItems;
            } else if (target.matches('[data-slide="prev"]')) {
                newIndex = (currentIndex - 1 + totalItems) % totalItems;
            } else if (target.matches('[data-slide-to]')) {
                 const slideTo = parseInt(target.dataset.slideTo, 10);
                 if (!isNaN(slideTo)) {
                    newIndex = slideTo;
                 }
            }

             if (newIndex !== currentIndex) {
                 updateCarousel(newIndex);
             }
        });
    }


    function renderizarComentarios(comentarios) {
        const listaComentarios = document.getElementById('comentarios-lista');
        if (!listaComentarios) return;

        listaComentarios.innerHTML = '';
        if (!comentarios || comentarios.length === 0) {
            listaComentarios.innerHTML = '<p>No hay comentarios todavía. ¡Sé el primero en comentar!</p>';
            return;
        }

        comentarios.forEach(com => {
            anadirComentarioALista(com);
        });
    }

    function anadirComentarioALista(com) {
        const listaComentarios = document.getElementById('comentarios-lista');
        if (!listaComentarios) return;

        const placeholder = listaComentarios.querySelector('p');
        if (placeholder && (placeholder.textContent.includes('No hay comentarios') || placeholder.textContent.includes('Cargando comentarios'))) {
            listaComentarios.innerHTML = '';
        }

        const profilePicComentarioHTML = com.usuario.foto_perfil
            ? `<img src="${com.usuario.foto_perfil}" alt="Foto de perfil" style="width: 30px; height: 30px; border-radius: 50%;">`
            : `<i class="fas fa-user-circle profile-placeholder-icon" style="font-size: 30px; width: 30px; height: 30px; display: inline-block; text-align: center; line-height: 30px;"></i>`;


        const fechaCom = new Date(com.fecha_creacion).toLocaleString('es-ES', { dateStyle: 'medium', timeStyle: 'short' });
        const comentarioCard = document.createElement('div');
        comentarioCard.className = 'comentario-card';
        comentarioCard.innerHTML = `
            <div class="comentario-header">
                ${profilePicComentarioHTML}
                <div class="comentario-autor-info">
                    <strong><a href="/perfil/${com.usuario.nickname}/">@${com.usuario.nickname}</a></strong>
                    <span>- ${fechaCom}</span>
                </div>
            </div>
            <div class="comentario-body">
                <p>${com.comentario.replace(/\n/g, '<br>')}</p>
            </div>
        `;
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
                if(boton) boton.disabled = true;
                if(boton) boton.textContent = 'Enviando...';

                const nuevoComentario = await window.api.fetchAPI(`/publicaciones/${publicacionId}/comentarios/`, {
                    method: 'POST',
                    body: JSON.stringify({ comentario: texto }),
                });

                textarea.value = '';
                anadirComentarioALista(nuevoComentario);

            } catch (error) {
                alert('Error al enviar el comentario.');
            } finally {
                if(boton) boton.disabled = false;
                if(boton) boton.textContent = 'Comentar';
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
                const resultado = await window.api.fetchAPI(`/publicaciones/${publicacionId}/reaccionar/`, {
                    method: 'POST'
                });

                if (resultado.status === 'reaccion_creada') {
                    currentCount++;
                    btn.classList.add('reaccionado');
                } else if (resultado.status === 'reaccion_eliminada') {
                    currentCount = Math.max(0, currentCount - 1);
                    btn.classList.remove('reaccionado');
                }
                 countSpan.textContent = currentCount;

            } catch (error) {
                alert('Error al procesar la reacción.');
            } finally {
                btn.disabled = false;
            }
        });
    }

    cargarDetalleCompleto();
});
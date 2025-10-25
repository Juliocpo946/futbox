document.addEventListener('DOMContentLoaded', async () => {
    window.auth.protectRoute();

    const container = document.getElementById('publicaciones-container');
    const searchForm = document.getElementById('search-form-nav');
    const searchInput = document.getElementById('search-input-nav');
    const mundialFilterSelect = document.getElementById('mundial-filter-nav');
    const tituloSeccion = document.getElementById('titulo-seccion');

    const lightbox = document.getElementById('media-lightbox');
    const lightboxClose = lightbox ? lightbox.querySelector('.lightbox-close') : null;
    const lightboxInner = lightbox ? lightbox.querySelector('.media-lightbox-carousel-inner') : null;
    const lightboxPrev = lightbox ? lightbox.querySelector('.media-lightbox-control.prev') : null;
    const lightboxNext = lightbox ? lightbox.querySelector('.media-lightbox-control.next') : null;

    let currentSearchQuery = '';
    let currentMundialId = '';
    let currentCategoriaId = '';
    let currentCategoriaNombre = '';
    let currentLightboxItems = [];
    let currentLightboxIndex = 0;
    let cachedPublications = [];

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
            if(currentMundialId) mundialFilterSelect.value = currentMundialId;
        } catch (error) {
            console.error("Error al cargar mundiales para filtro:", error);
        }
    }


    async function cargarPublicaciones() {
        if (!container) return;
        container.innerHTML = '<p>Cargando publicaciones...</p>';
        cachedPublications = [];

        try {
            let endpoint = '/publicaciones/?';
            const params = [];
            if (currentSearchQuery) params.push(`search=${encodeURIComponent(currentSearchQuery)}`);
            if (currentMundialId) params.push(`mundial=${currentMundialId}`);
            if (currentCategoriaId) params.push(`categoria=${currentCategoriaId}`);
            endpoint += params.join('&');

            actualizarTituloSeccion();

            const publicaciones = await window.api.fetchAPI(endpoint);
            cachedPublications = publicaciones;
            renderPublicaciones(publicaciones);

        } catch (error) {
            container.innerHTML = '<p>Error al cargar las publicaciones. Inténtalo de nuevo más tarde.</p>';
             console.error(error);
        }
    }

    function actualizarTituloSeccion() {
         if (!tituloSeccion) return;
        let titulo = 'Comunidad';
        const filtros = [];
        if(currentCategoriaNombre) {
            filtros.push(`Categoría: "${currentCategoriaNombre}"`);
        }
         if (currentMundialId && mundialFilterSelect) {
            const selectedOption = mundialFilterSelect.options[mundialFilterSelect.selectedIndex];
            if (selectedOption && selectedOption.value) {
                 filtros.push(`Mundial: "${selectedOption.text}"`);
            }
        }
        if (currentSearchQuery) {
            filtros.push(`Búsqueda: "${currentSearchQuery}"`);
        }

        if (filtros.length > 0) {
            titulo = `Resultados para: ${filtros.join(', ')}`;
        }

        tituloSeccion.innerHTML = titulo;
    }


    function renderPublicaciones(publicaciones) {
         if (!container) return;
        if (publicaciones.length === 0) {
            container.innerHTML = '<p>No se encontraron publicaciones con los filtros aplicados. ¡Sé el primero en publicar!</p>';
            return;
        }

        container.innerHTML = '';
        publicaciones.forEach((pub, pubIndex) => {
            const card = document.createElement('div');
            card.className = 'publicacion-card';
            card.dataset.id = pub.id;
            card.dataset.index = pubIndex;

            const fecha = new Date(pub.fecha_publicacion).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });

            const profilePicHTML = pub.autor.foto_perfil
                ? `<img src="${pub.autor.foto_perfil}" alt="Foto de perfil">`
                : `<i class="fas fa-user-circle profile-placeholder-icon"></i>`;


            let mediaHTML = '';
            let mediaIndicatorHTML = '';
            if (pub.multimedia && pub.multimedia.length > 0) {
                 const firstItem = pub.multimedia[0];
                 if (firstItem.media_type === 'image') {
                    mediaHTML = `<img src="${firstItem.path}" alt="${pub.titulo}" data-media-index="0">`;
                 } else if (firstItem.media_type === 'video') {
                     mediaHTML = `<video muted loop playsinline src="${firstItem.path}#t=0.5" preload="metadata" data-media-index="0"></video>`;
                 } else {
                      mediaHTML = `<span class="media-placeholder-icon"><i class="fas fa-ban"></i></span>`;
                 }
                 if (pub.multimedia.length > 1) {
                    mediaIndicatorHTML = `<span class="multi-media-indicator"><i class="fas fa-images"></i> ${pub.multimedia.length}</span>`;
                 }

            } else {
                 mediaHTML = `<span class="media-placeholder-icon"><i class="far fa-image"></i></span>`;
            }
            
            let metaHTML = '<div class="publicacion-meta">';
            if (pub.categoria && pub.categoria.nombre) {
                metaHTML += `<span class="publicacion-meta-item"><i class="fas fa-tags"></i> ${pub.categoria.nombre}</span>`;
            }
            if (pub.mundial && pub.mundial.año) {
                metaHTML += `<span class="publicacion-meta-item"><i class="fas fa-trophy"></i> ${pub.mundial.nombre || `Mundial ${pub.mundial.año}`}</span>`;
            }
            metaHTML += '</div>';

            card.innerHTML = `
                <div class="publicacion-media">
                    ${mediaHTML}
                    ${mediaIndicatorHTML}
                </div>
                <div class="publicacion-info">
                    <div class="publicacion-header">
                        ${profilePicHTML}
                        <div class="publicacion-autor-info">
                            <span class="nombre">${pub.autor.nombre}</span>
                            <p class="fecha"><a href="/perfil/${pub.autor.nickname}/">@${pub.autor.nickname}</a> - ${fecha}</p>
                        </div>
                    </div>
                    <div class="publicacion-body" style="cursor: pointer;" onclick="window.location.href='/publicaciones/${pub.id}/'">
                        <h3>${pub.titulo}</h3>
                        ${metaHTML}
                        <p>${pub.descripcion}</p>
                    </div>
                    <div class="publicacion-footer">
                        <div class="card-comentarios-preview" data-pub-id="${pub.id}">
                            <p class="loading-comments">Cargando comentarios...</p>
                        </div>
                        <div class="publicacion-stats">
                            <div class="reacciones-info">
                                <i class="fas fa-heart"></i>
                                <span class="reaccion-count">${pub.reacciones_count}</span>
                            </div>
                            <div class="comentarios-info" style="cursor: pointer;" onclick="window.location.href='/publicaciones/${pub.id}/#comentarios-section'">
                                <i class="fas fa-comment"></i>
                                <span>${pub.comentarios_count}</span>
                            </div>
                        </div>
                        <form class="comentario-form">
                            <textarea placeholder="Añade un comentario..." rows="1"></textarea>
                            <button type="submit">Publicar</button>
                        </form>
                    </div>
                </div>
            `;
            container.appendChild(card);
            cargarYRenderizarComentariosPreview(pub.id);
        });

        if(!document.head.querySelector('style[data-indicator-style]')) {
             const style = document.createElement('style');
             style.setAttribute('data-indicator-style', 'true');
             style.textContent = `
                .publicacion-media { position: relative; }
                .multi-media-indicator {
                    position: absolute; top: 10px; right: 10px;
                    background-color: rgba(0, 0, 0, 0.6); color: white;
                    padding: 3px 8px; border-radius: 10px; font-size: 0.8em; z-index: 5; }
            `;
            document.head.appendChild(style);
        }
    }

    async function cargarYRenderizarComentariosPreview(publicacionId) {
        const previewContainer = document.querySelector(`.card-comentarios-preview[data-pub-id="${publicacionId}"]`);
        if (!previewContainer) return;

        try {
            const comentarios = await window.api.fetchAPI(`/publicaciones/${publicacionId}/comentarios/`);
            const ultimosComentarios = comentarios.slice(-2); 

            if (ultimosComentarios.length === 0) {
                previewContainer.innerHTML = '<p class="no-comments">Sin comentarios aún.</p>';
                return;
            }

            let comentariosHTML = '';
            ultimosComentarios.forEach(com => {
                const profilePicComentarioHTML = com.usuario.foto_perfil
                    ? `<img src="${com.usuario.foto_perfil}" alt="Avatar">`
                    : `<i class="fas fa-user-circle profile-placeholder-icon-small"></i>`;
                comentariosHTML += `
                    <div class="card-comentario-item">
                        <div class="card-comentario-autor">
                            ${profilePicComentarioHTML}
                            <strong><a href="/perfil/${com.usuario.nickname}/">@${com.usuario.nickname}</a>:</strong>
                        </div>
                        <p>${com.comentario.substring(0, 50)}${com.comentario.length > 50 ? '...' : ''}</p>
                    </div>
                `;
            });
            previewContainer.innerHTML = comentariosHTML;

        } catch (error) {
            previewContainer.innerHTML = '<p class="error-comments">Error al cargar comentarios.</p>';
            console.error(`Error cargando comentarios para pub ${publicacionId}:`, error);
        }
    }


    function openLightbox(publicationIndex, mediaIndex) {
        const publication = cachedPublications[publicationIndex];
        if (!publication || !publication.multimedia || !lightbox || !lightboxInner) return;

        currentLightboxItems = publication.multimedia;
        currentLightboxIndex = mediaIndex;

        renderLightboxContent();

        lightbox.classList.add('visible');
    }

    function closeLightbox() {
        if(lightbox) lightbox.classList.remove('visible');
         if(lightboxInner) lightboxInner.innerHTML = '';
         const videos = lightbox ? lightbox.querySelectorAll('video') : [];
         videos.forEach(v => v.pause());
    }

    function renderLightboxContent() {
         if (!lightboxInner || currentLightboxItems.length === 0) return;

         lightboxInner.innerHTML = currentLightboxItems.map((item, index) => {
            let content;
             if (item.media_type === 'image') {
                content = `<img src="${item.path}" alt="Media ${index + 1}">`;
             } else if (item.media_type === 'video') {
                 content = `<video controls preload="metadata"><source src="${item.path}" type="video/mp4">Video no soportado.</video>`;
             } else {
                 content = `<span>Archivo no soportado</span>`;
             }
             return `<div class="media-lightbox-carousel-item ${index === currentLightboxIndex ? 'active' : ''}">${content}</div>`;
         }).join('');

         updateLightboxControls();
    }

     function showLightboxSlide(index) {
        if (!lightboxInner || index < 0 || index >= currentLightboxItems.length) return;

        const items = lightboxInner.querySelectorAll('.media-lightbox-carousel-item');
        if (items[currentLightboxIndex]) {
            items[currentLightboxIndex].classList.remove('active');
            const currentVideo = items[currentLightboxIndex].querySelector('video');
            if(currentVideo) currentVideo.pause();
        }

        currentLightboxIndex = index;

        if (items[currentLightboxIndex]) {
            items[currentLightboxIndex].classList.add('active');
        }

        updateLightboxControls();
     }


    function updateLightboxControls() {
        if(!lightboxPrev || !lightboxNext) return;
        const total = currentLightboxItems.length;
        if (total <= 1) {
            lightboxPrev.style.display = 'none';
            lightboxNext.style.display = 'none';
        } else {
            lightboxPrev.style.display = 'block';
            lightboxNext.style.display = 'block';
            lightboxPrev.disabled = currentLightboxIndex === 0;
            lightboxNext.disabled = currentLightboxIndex === total - 1;
        }
    }


    if (container) {
        container.addEventListener('click', async (e) => {
            const card = e.target.closest('.publicacion-card');
            if (!card) return;

            const publicacionId = card.dataset.id;
            const publicationIndex = parseInt(card.dataset.index, 10);

            const mediaTarget = e.target.closest('.publicacion-media img, .publicacion-media video');
            if(mediaTarget && !isNaN(publicationIndex)) {
                const mediaIndex = parseInt(mediaTarget.dataset.mediaIndex || '0', 10);
                openLightbox(publicationIndex, mediaIndex);
                return;
            }


            if (e.target.closest('.reacciones-info')) {
                try {
                    const resultado = await window.api.fetchAPI(`/publicaciones/${publicacionId}/reaccionar/`, { method: 'POST' });
                    const countSpan = card.querySelector('.reaccion-count');
                    if (countSpan) {
                         let currentCount = parseInt(countSpan.textContent, 10);
                         if (resultado.status === 'reaccion_creada') {
                             countSpan.textContent = currentCount + 1;
                         } else if (resultado.status === 'reaccion_eliminada' && currentCount > 0) {
                             countSpan.textContent = currentCount - 1;
                         }
                         if(cachedPublications[publicationIndex]){
                            cachedPublications[publicationIndex].reacciones_count = parseInt(countSpan.textContent, 10);
                         }
                    }

                } catch (error) {
                    alert('Error al procesar la reacción.');
                }
            }
        });

        container.addEventListener('submit', async (e) => {
            if (e.target.classList.contains('comentario-form')) {
                e.preventDefault();
                const card = e.target.closest('.publicacion-card');
                if (!card) return;
                const publicacionId = card.dataset.id;
                const publicationIndex = parseInt(card.dataset.index, 10);
                const textarea = e.target.querySelector('textarea');
                const texto = textarea.value.trim();

                if (!texto) return;
                const button = e.target.querySelector('button');
                try {
                    if(button) button.disabled = true;
                    const nuevoComentario = await window.api.fetchAPI(`/publicaciones/${publicacionId}/comentarios/`, {
                        method: 'POST',
                        body: JSON.stringify({ comentario: texto }),
                    });
                    textarea.value = '';

                     const commentInfo = card.querySelector('.comentarios-info span');
                     if(commentInfo) {
                         let currentCount = parseInt(commentInfo.textContent, 10);
                         commentInfo.textContent = currentCount + 1;
                         if(cachedPublications[publicationIndex]){
                            cachedPublications[publicationIndex].comentarios_count = currentCount + 1;
                         }
                     }
                     cargarYRenderizarComentariosPreview(publicacionId);

                } catch (error) {
                    alert('Error al publicar el comentario.');
                } finally {
                     if(button) button.disabled = false;
                }
            }
        });
    }


    if (lightboxClose) {
        lightboxClose.addEventListener('click', closeLightbox);
    }
    if (lightbox) {
        lightbox.addEventListener('click', (e) => {
            if (e.target === lightbox) {
                closeLightbox();
            }
        });
    }
     if (lightboxPrev) {
        lightboxPrev.addEventListener('click', () => {
             if(currentLightboxIndex > 0) showLightboxSlide(currentLightboxIndex - 1);
        });
     }
      if (lightboxNext) {
        lightboxNext.addEventListener('click', () => {
             if(currentLightboxIndex < currentLightboxItems.length - 1) showLightboxSlide(currentLightboxIndex + 1);
        });
     }


    if (searchForm && searchInput) {
        searchForm.addEventListener('submit', (e) => {
            e.preventDefault();
            currentSearchQuery = searchInput.value.trim();
            cargarPublicaciones();
        });
    }

    if(mundialFilterSelect) {
        mundialFilterSelect.addEventListener('change', (e) => {
            currentMundialId = e.target.value;
            cargarPublicaciones();
        });
    }

    document.addEventListener('filterByCategory', (event) => {
        currentCategoriaId = event.detail.categoryId;
        currentCategoriaNombre = event.detail.categoryName;
        currentSearchQuery = '';
        currentMundialId = '';
        if(searchInput) searchInput.value = '';
        if(mundialFilterSelect) mundialFilterSelect.value = '';
        cargarPublicaciones();
    });

    const urlParams = new URLSearchParams(window.location.search);
    currentCategoriaId = urlParams.get('categoria') || '';
    currentMundialId = urlParams.get('mundial') || '';
    currentSearchQuery = urlParams.get('search') || '';
    if (currentSearchQuery && searchInput) searchInput.value = currentSearchQuery;

    await cargarMundialesSelect();

    if (currentCategoriaId) {
         try {
             const categorias = await window.api.fetchAPI('/publicaciones/categorias/');
             const cat = categorias.find(c => c.id == currentCategoriaId);
             if (cat) currentCategoriaNombre = cat.nombre;
         } catch(e) { console.error("Error obteniendo nombre de categoría inicial"); }

    }

    cargarPublicaciones();
});
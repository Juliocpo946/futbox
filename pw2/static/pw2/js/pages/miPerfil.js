document.addEventListener('DOMContentLoaded', async () => {
    window.auth.protectRoute();

    const lightbox = document.getElementById('media-lightbox');
    const lightboxModal = document.getElementById('media-lightbox');
    const lightboxInner = lightboxModal ? lightboxModal.querySelector('.media-lightbox-carousel-inner') : null;
    const lightboxClose = lightboxModal ? lightboxModal.querySelector('.lightbox-close') : null;
    const lightboxPrev = lightboxModal ? lightboxModal.querySelector('.media-lightbox-control.prev') : null;
    const lightboxNext = lightboxModal ? lightboxModal.querySelector('.media-lightbox-control.next') : null;


    let currentLightboxItems = [];
    let currentLightboxIndex = 0;
    let cachedMiPerfilPublications = [];

    async function cargarDatosPerfil() {
        const container = document.getElementById('perfil-header-container');
        if(!container) return;
        try {
            const userData = await window.api.fetchAPI('/usuarios/perfil/');

            const profilePicHTML = userData.foto_perfil
                ? `<img id="perfil-foto" src="${userData.foto_perfil}" alt="Foto de Perfil" class="perfil-foto-grande">`
                : `<i class="fas fa-user-circle profile-placeholder-icon-large"></i>`;

            container.innerHTML = `
                <div class="perfil-header">
                    ${profilePicHTML}
                    <div class="perfil-info">
                        <h1 id="perfil-nombre">${userData.nombre} ${userData.apellido_paterno || ''}</h1>
                        <p id="perfil-nickname" class="nickname-perfil">@${userData.nickname}</p>
                        <p id="perfil-correo" class="correo-perfil">${userData.correo}</p>
                        <div class="perfil-acciones">
                            <a href="/editar-perfil/" class="btn-editar-perfil" style="text-decoration: none;">Editar Perfil</a>
                            <button id="logout-button" class="btn-cerrar-sesion">Cerrar Sesion</button>
                        </div>
                    </div>
                </div>
            `;
            const logoutButton = document.getElementById('logout-button');
             if(logoutButton) logoutButton.addEventListener('click', () => window.auth.logout());
        } catch (error) {
            container.innerHTML = "<p>Error al cargar los datos del perfil.</p>";
            console.error(error);
        }
    }

    async function cargarMisPublicaciones() {
        const container = document.getElementById('mis-publicaciones-container');
        if(!container) return;
        try {
            const publicaciones = await window.api.fetchAPI('/usuarios/mis-publicaciones/');
            cachedMiPerfilPublications = publicaciones;
            if (publicaciones.length === 0) {
                container.innerHTML = "<p>Aun no has creado ninguna publicacion.</p>";
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

                const estatusClass = `estatus-${pub.estatus}`;
                const estatusTexto = pub.estatus.charAt(0).toUpperCase() + pub.estatus.slice(1);

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
                        <div class="publicacion-body" style="${pub.estatus === 'aprobada' ? 'cursor: pointer;' : ''}" ${pub.estatus === 'aprobada' ? `onclick="window.location.href='/publicaciones/${pub.id}/'"` : ''}>
                            <h3>${pub.titulo}</h3>
                            <p>${pub.descripcion.substring(0, 150)}${pub.descripcion.length > 150 ? '...' : ''}</p>
                        </div>
                        <div class="publicacion-footer">
                           <div class="publicacion-stats">
                                <div class="reacciones-info">
                                    <i class="fas fa-heart"></i>
                                    <span class="reaccion-count">${pub.reacciones_count}</span>
                                </div>
                                <div class="comentarios-info" ${pub.estatus === 'aprobada' ? `onclick="window.location.href='/publicaciones/${pub.id}/#comentarios-section'"` : ''} style="${pub.estatus === 'aprobada' ? 'cursor: pointer;' : ''}">
                                    <i class="fas fa-comment"></i>
                                    <span>${pub.comentarios_count}</span>
                                </div>
                                <span class="estatus-publicacion ${estatusClass}" style="margin-left: auto;">${estatusTexto}</span>
                            </div>
                        </div>
                    </div>
                `;
                container.appendChild(card);
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

        } catch (error) {
            container.innerHTML = "<p>Error al cargar tus publicaciones.</p>";
            console.error(error);
        }
    }

    function openLightbox(publicationIndex, mediaIndex) {
        const publication = cachedMiPerfilPublications[publicationIndex];
        if (!publication || !publication.multimedia || !lightboxModal || !lightboxInner) return;

        currentLightboxItems = publication.multimedia;
        currentLightboxIndex = mediaIndex;

        renderLightboxContent();
        lightboxModal.classList.add('visible');
    }

    function closeLightbox() {
        if(lightboxModal) lightboxModal.classList.remove('visible');
         if(lightboxInner) lightboxInner.innerHTML = '';
         const videos = lightboxModal ? lightboxModal.querySelectorAll('video') : [];
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

    const pubContainer = document.getElementById('mis-publicaciones-container');
    if(pubContainer) {
        pubContainer.addEventListener('click', async (e) => {
            const card = e.target.closest('.publicacion-card');
            if (!card) return;

            const publicationIndex = parseInt(card.dataset.index, 10);
            const mediaTarget = e.target.closest('.publicacion-media img, .publicacion-media video, .publicacion-media .media-placeholder-icon');

            if(mediaTarget && !isNaN(publicationIndex)) {
                const pubData = cachedMiPerfilPublications[publicationIndex];
                 if (pubData && pubData.multimedia && pubData.multimedia.length > 0) {
                     const mediaIndex = parseInt(mediaTarget.dataset.mediaIndex || '0', 10);
                     openLightbox(publicationIndex, mediaIndex);
                 }
                return;
            }

            if (e.target.closest('.reacciones-info')) {
                const publicacionId = card.dataset.id;
                 const pubData = cachedMiPerfilPublications[publicationIndex];
                 if (pubData && pubData.estatus !== 'aprobada') return;

                try {
                    const resultado = await window.api.fetchAPI(`/publicaciones/${publicacionId}/reaccionar/`, { method: 'POST' });
                    const countSpan = card.querySelector('.reaccion-count');
                    if(countSpan) {
                         let currentCount = parseInt(countSpan.textContent, 10);
                         if (resultado.status === 'reaccion_creada') {
                             countSpan.textContent = currentCount + 1;
                         } else if (resultado.status === 'reaccion_eliminada' && currentCount > 0) {
                             countSpan.textContent = currentCount - 1;
                         }
                         if(cachedMiPerfilPublications[publicationIndex]) {
                            cachedMiPerfilPublications[publicationIndex].reacciones_count = parseInt(countSpan.textContent, 10);
                         }
                    }

                } catch (error) {
                    alert('Error al procesar la reacción.');
                }
            }
        });
    }


    if (lightboxClose) {
        lightboxClose.addEventListener('click', closeLightbox);
    }
    if (lightboxModal) {
        lightboxModal.addEventListener('click', (e) => {
            if (e.target === lightboxModal) {
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

    cargarDatosPerfil();
    cargarMisPublicaciones();
});
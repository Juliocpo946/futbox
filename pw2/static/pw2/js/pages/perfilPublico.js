document.addEventListener('DOMContentLoaded', async () => {
    window.auth.protectRoute();

    const container = document.getElementById('perfil-publico-container');
    const nickname = NICKNAME_PERFIL;
    const lightbox = new window.MediaLightbox('media-lightbox');
    let cachedPerfilPublicoPublications = [];
    let perfilData = null;
    let pollingIntervalId = null;
    let lastPubId = 0;

    const filtros = new window.FiltrosPublicaciones({
        tituloSeccionId: null,
        onFilterChange: (endpoint) => {
            stopPolling();
            const params = new URLSearchParams(endpoint.split('?')[1]);
            window.location.href = `/publicaciones/?${params.toString()}`;
        }
    });

    async function cargarPerfilPublicoInicial() {
        if (!container) return;
        try {
            perfilData = await window.api.fetchAPI(`/perfil/${nickname}/`);
            renderizarPerfil(perfilData);
            await cargarNuevasPublicaciones(true);
        } catch (error) {
            container.innerHTML = `<h1>Usuario @${nickname} no encontrado.</h1>`;
            console.error(error);
        }
    }

    async function cargarNuevasPublicaciones(inicial = false) {
        const pubContainer = document.getElementById('publicaciones-container');
        if (!pubContainer || !perfilData) return;
        if (inicial) {
             pubContainer.innerHTML = '<p>Cargando publicaciones...</p>';
             cachedPerfilPublicoPublications = [];
             lastPubId = 0;
        }
        
        let endpoint = `/perfil/publicaciones/${perfilData.id}/`;
        if (!inicial && lastPubId > 0) {
             endpoint += `?since_id=${lastPubId}`;
        }

        try {
            const nuevasPublicaciones = await window.api.fetchAPI(endpoint);
            
            if (nuevasPublicaciones.length > 0) {
                const combined = [...nuevasPublicaciones, ...cachedPerfilPublicoPublications];
                 const uniqueIds = new Set();
                 cachedPerfilPublicoPublications = combined.filter(pub => {
                     if (!uniqueIds.has(pub.id)) {
                         uniqueIds.add(pub.id);
                         return true;
                     }
                     return false;
                 }).sort((a, b) => new Date(b.fecha_publicacion) - new Date(a.fecha_publicacion));
                 
                 if (cachedPerfilPublicoPublications.length > 0) {
                    lastPubId = cachedPerfilPublicoPublications[0].id;
                 }
                
                renderizarPublicaciones(cachedPerfilPublicoPublications, perfilData);
            } else if (inicial && cachedPerfilPublicoPublications.length === 0) {
                 pubContainer.innerHTML = `<p>@${perfilData.nickname} aún no tiene publicaciones.</p>`;
            }
            
             if (inicial && !pollingIntervalId) {
                startPolling();
            }

        } catch (error) {
            if (inicial) pubContainer.innerHTML = `<p>Error al cargar publicaciones.</p>`;
            console.error(error);
            stopPolling();
        }
    }


    function renderizarPerfil(perfil) {
        if (!container) return;
        const fechaRegistro = new Date(perfil.fecha_registro).toLocaleDateString('es-ES', { year: 'numeric', month: 'long' });
        const profilePicHTML = perfil.foto_perfil ? `<img src="${perfil.foto_perfil}" alt="Foto" class="perfil-foto-grande">` : `<i class="fas fa-user-circle profile-placeholder-icon-large"></i>`;
        container.innerHTML = `<div class="perfil-header">${profilePicHTML}<div class="perfil-info"><h1>${perfil.nombre}</h1><p class="nickname-perfil">@${perfil.nickname}</p><p class="correo-perfil">Usuario desde ${fechaRegistro}</p></div></div><div class="perfil-contenido"><h2 id="publicaciones-titulo">Publicaciones de @${perfil.nickname}</h2><div id="publicaciones-container" class="publicaciones-grid"></div></div>`;
    }

    function renderizarPublicaciones(publicaciones, autor) {
        const pubContainer = document.getElementById('publicaciones-container');
        if (!pubContainer) return;
        if (publicaciones.length === 0) {
            pubContainer.innerHTML = `<p>@${autor.nickname} aún no tiene publicaciones.</p>`;
            return;
        }
        pubContainer.innerHTML = '';
        publicaciones.forEach((pub, pubIndex) => {
            const card = window.publicacionesUtils.crearCardPublicacion(pub, pubIndex, false);
            pubContainer.appendChild(card);
            window.comentariosUtils.cargarYRenderizarComentariosPreview(pub.id);
        });
        window.publicacionesUtils.agregarEstilosIndicador();
    }

    if (container) {
        container.addEventListener('click', async (e) => {
            const card = e.target.closest('.publicacion-card');
            if (!card) return;
            const publicationIndex = parseInt(card.dataset.index, 10);
            const mediaTarget = e.target.closest('.publicacion-media img, .publicacion-media video, .publicacion-media .media-placeholder-icon');
            if (mediaTarget && !isNaN(publicationIndex)) {
                const pubData = cachedPerfilPublicoPublications[publicationIndex];
                if (pubData?.multimedia?.length > 0) {
                    const mediaIndex = parseInt(mediaTarget.dataset.mediaIndex || '0', 10);
                    lightbox.open(pubData.multimedia, mediaIndex);
                }
                return;
            }
            if (e.target.closest('.reacciones-info')) {
                const publicacionId = card.dataset.id;
                window.comentariosUtils.manejarReaccion(publicacionId, card, cachedPerfilPublicoPublications, publicationIndex);
            }
        });
        container.addEventListener('submit', async (e) => {
            if (e.target.classList.contains('comentario-form')) {
                const card = e.target.closest('.publicacion-card');
                if (!card) return;
                const publicacionId = card.dataset.id;
                const publicationIndex = parseInt(card.dataset.index, 10);
                window.comentariosUtils.manejarComentario(e, publicacionId, card, cachedPerfilPublicoPublications, publicationIndex);
            }
        });
    }

    function startPolling() {
        stopPolling();
        pollingIntervalId = setInterval(cargarNuevasPublicaciones, 25000);
    }

    function stopPolling() {
        if (pollingIntervalId) {
            clearInterval(pollingIntervalId);
            pollingIntervalId = null;
        }
    }

    await window.inicializarBarraNavegacion();
    await cargarPerfilPublicoInicial();
    
    window.addEventListener('beforeunload', stopPolling);
});
document.addEventListener('DOMContentLoaded', async () => {
    window.auth.protectRoute();

    const container = document.getElementById('perfil-publico-container');
    const nickname = NICKNAME_PERFIL;
    const lightbox = new window.MediaLightbox('media-lightbox');

    let cachedPerfilPublicoPublications = [];
    let perfilData = null;

    const filtros = new window.FiltrosPublicaciones({
        tituloSeccionId: null,
        onFilterChange: (endpoint) => {
            const params = new URLSearchParams(endpoint.split('?')[1]);
            window.location.href = `/publicaciones/?${params.toString()}`;
        }
    });

    async function cargarPerfilPublico() {
        if (!container) return;
        try {
            perfilData = await window.api.fetchAPI(`/perfil/${nickname}/`);
            const publicaciones = await window.api.fetchAPI(`/perfil/publicaciones/${perfilData.id}/`);
            cachedPerfilPublicoPublications = publicaciones;

            renderizarPerfil(perfilData);
            renderizarPublicaciones(publicaciones, perfilData);
        } catch (error) {
            container.innerHTML = `<h1>Usuario no encontrado</h1><p>El perfil de @${nickname} no existe o no está disponible.</p>`;

        }
    }

    function renderizarPerfil(perfil) {
        if (!container) return;
        const fechaRegistro = new Date(perfil.fecha_registro).toLocaleDateString('es-ES', {
            year: 'numeric', month: 'long'
        });

        const profilePicHTML = perfil.foto_perfil
            ? `<img src="${perfil.foto_perfil}" alt="Foto de ${perfil.nombre}" class="perfil-foto-grande">`
            : `<i class="fas fa-user-circle profile-placeholder-icon-large"></i>`;

        container.innerHTML = `
            <div class="perfil-header">
                ${profilePicHTML}
                <div class="perfil-info">
                    <h1>${perfil.nombre}</h1>
                    <p class="nickname-perfil">@${perfil.nickname}</p>
                    <p class="correo-perfil">Usuario desde ${fechaRegistro}</p>
                </div>
            </div>
            <div class="perfil-contenido">
                <h2 id="publicaciones-titulo">Publicaciones de @${perfil.nickname}</h2>
                <div id="publicaciones-container" class="publicaciones-grid"></div>
            </div>
        `;
    }

    function renderizarPublicaciones(publicaciones, autor) {
        const pubContainer = document.getElementById('publicaciones-container');
        if (!pubContainer) return;

        if (publicaciones.length === 0) {
            pubContainer.innerHTML = `<p>@${autor.nickname} aún no tiene publicaciones aprobadas.</p>`;
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
                if (pubData && pubData.multimedia && pubData.multimedia.length > 0) {
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

    await window.inicializarBarraNavegacion();
    cargarPerfilPublico();
});
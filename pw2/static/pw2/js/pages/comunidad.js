document.addEventListener('DOMContentLoaded', async () => {
    window.auth.protectRoute();

    const container = document.getElementById('publicaciones-container');
    const lightbox = new window.MediaLightbox('media-lightbox');
    let cachedPublications = [];

    const filtros = new window.FiltrosPublicaciones({
        tituloSeccionId: 'titulo-seccion',
        onFilterChange: cargarPublicaciones
    });

    async function cargarPublicaciones(endpoint) {
        if (!container) return;
        container.innerHTML = '<p>Cargando publicaciones...</p>';
        cachedPublications = [];

        try {
            const publicaciones = await window.api.fetchAPI(endpoint || filtros.getEndpointConFiltros());
            cachedPublications = publicaciones;
            renderPublicaciones(publicaciones);
        } catch (error) {
            container.innerHTML = '<p>Error al cargar las publicaciones. Inténtalo de nuevo más tarde.</p>';
            console.error(error);
        }
    }

    function renderPublicaciones(publicaciones) {
        if (!container) return;
        if (publicaciones.length === 0) {
            container.innerHTML = '<p>No se encontraron publicaciones con los filtros aplicados. ¡Sé el primero en publicar!</p>';
            return;
        }

        container.innerHTML = '';
        publicaciones.forEach((pub, pubIndex) => {
            const card = window.publicacionesUtils.crearCardPublicacion(pub, pubIndex, false);
            container.appendChild(card);
            window.comentariosUtils.cargarYRenderizarComentariosPreview(pub.id);
        });

        window.publicacionesUtils.agregarEstilosIndicador();
    }

    if (container) {
        container.addEventListener('click', async (e) => {
            const card = e.target.closest('.publicacion-card');
            if (!card) return;

            const publicacionId = card.dataset.id;
            const publicationIndex = parseInt(card.dataset.index, 10);

            const mediaTarget = e.target.closest('.publicacion-media img, .publicacion-media video');
            if (mediaTarget && !isNaN(publicationIndex)) {
                const mediaIndex = parseInt(mediaTarget.dataset.mediaIndex || '0', 10);
                const publication = cachedPublications[publicationIndex];
                if (publication && publication.multimedia && publication.multimedia.length > 0) {
                    lightbox.open(publication.multimedia, mediaIndex);
                }
                return;
            }

            if (e.target.closest('.reacciones-info')) {
                window.comentariosUtils.manejarReaccion(publicacionId, card, cachedPublications, publicationIndex);
            }
        });

        container.addEventListener('submit', async (e) => {
            if (e.target.classList.contains('comentario-form')) {
                const card = e.target.closest('.publicacion-card');
                if (!card) return;
                const publicacionId = card.dataset.id;
                const publicationIndex = parseInt(card.dataset.index, 10);
                window.comentariosUtils.manejarComentario(e, publicacionId, card, cachedPublications, publicationIndex);
            }
        });
    }

    await window.inicializarBarraNavegacion();
    await filtros.cargarNombreCategoria();
    filtros.aplicarFiltros();
});
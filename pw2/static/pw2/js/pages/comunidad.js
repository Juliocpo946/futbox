document.addEventListener('DOMContentLoaded', async () => {
    window.auth.protectRoute();

    const container = document.getElementById('publicaciones-container');
    const lightbox = new window.MediaLightbox('media-lightbox');
    let cachedPublications = [];
    let pollingIntervalId = null;
    let lastFetchTimestamp = 0;

    const filtros = new window.FiltrosPublicaciones({
        tituloSeccionId: 'titulo-seccion',
        onFilterChange: (endpoint) => {
            stopPolling();
            cargarPublicaciones(endpoint, true);
        }
    });

    async function cargarPublicaciones(endpoint, isFilterChange = false) {
        if (!container) return;
        if (isFilterChange) {
            container.innerHTML = '<p>Cargando publicaciones...</p>';
            cachedPublications = [];
            lastFetchTimestamp = 0;
        }

        const currentEndpoint = endpoint || filtros.getEndpointConFiltros();
        const fetchUrl = lastFetchTimestamp > 0
            ? `${currentEndpoint}&since=${lastFetchTimestamp}`
            : currentEndpoint;

        try {
            const nuevasPublicaciones = await window.api.fetchAPI(fetchUrl);

            if (nuevasPublicaciones.length > 0) {
                 lastFetchTimestamp = Date.now();
                 
                 const combined = [...nuevasPublicaciones, ...cachedPublications];
                 const uniqueIds = new Set();
                 cachedPublications = combined.filter(pub => {
                     if (!uniqueIds.has(pub.id)) {
                         uniqueIds.add(pub.id);
                         return true;
                     }
                     return false;
                 }).sort((a, b) => new Date(b.fecha_publicacion) - new Date(a.fecha_publicacion));

                 renderPublicaciones(cachedPublications);
            } else if (isFilterChange && cachedPublications.length === 0) {
                 container.innerHTML = '<p>No se encontraron publicaciones con los filtros aplicados.</p>';
            }

            if (!pollingIntervalId) {
                startPolling(currentEndpoint);
            }

        } catch (error) {
            if (isFilterChange) {
                container.innerHTML = '<p>Error al cargar las publicaciones.</p>';
            }
            console.error(error);
            stopPolling();
        }
    }

    function renderPublicaciones(publicaciones) {
        if (!container) return;
        container.innerHTML = '';
        if (publicaciones.length === 0) {
            container.innerHTML = '<p>No se encontraron publicaciones.</p>';
            return;
        }

        publicaciones.forEach((pub, pubIndex) => {
            const card = window.publicacionesUtils.crearCardPublicacion(pub, pubIndex, false);
            container.appendChild(card);
            window.comentariosUtils.cargarYRenderizarComentariosPreview(pub.id);
        });
        window.publicacionesUtils.agregarEstilosIndicador();
    }

    function startPolling(endpoint) {
        stopPolling();
        pollingIntervalId = setInterval(() => cargarPublicaciones(endpoint, false), 20000);
    }

    function stopPolling() {
        if (pollingIntervalId) {
            clearInterval(pollingIntervalId);
            pollingIntervalId = null;
        }
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

    window.addEventListener('beforeunload', stopPolling);
});
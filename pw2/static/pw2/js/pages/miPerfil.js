document.addEventListener('DOMContentLoaded', async () => {
    window.auth.protectRoute();

    const lightbox = new window.MediaLightbox('media-lightbox');
    let cachedMiPerfilPublications = [];
    const filtroEstatusSelect = document.getElementById('filtro-estatus-perfil');

    async function cargarDatosPerfil() {
        const container = document.getElementById('perfil-header-container');
        if (!container) return;
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
            if (logoutButton) logoutButton.addEventListener('click', () => window.auth.logout());
        } catch (error) {
            container.innerHTML = "<p>Error al cargar los datos del perfil.</p>";
            console.error(error);
        }
    }

    async function cargarMisPublicaciones(estatus = '') {
        const container = document.getElementById('mis-publicaciones-container');
        if (!container) return;
        container.innerHTML = '<p>Cargando publicaciones...</p>'; 
        try {
            
            let endpoint = '/usuarios/mis-publicaciones/';
            if (estatus) {
                endpoint += `?estatus=${estatus}`;
            }
            
            const publicaciones = await window.api.fetchAPI(endpoint);
            cachedMiPerfilPublications = publicaciones; 

            if (publicaciones.length === 0) {
                let mensaje = "Aun no has creado ninguna publicacion.";
                if (estatus) {
                    mensaje = `No tienes publicaciones con el estado '${estatus}'.`;
                }
                container.innerHTML = `<p>${mensaje}</p>`;
                return;
            }

            container.innerHTML = '';
            publicaciones.forEach((pub, pubIndex) => {
                const card = window.publicacionesUtils.crearCardPublicacion(pub, pubIndex, true);
                container.appendChild(card);
                if (pub.estatus === 'aprobada') {
                    window.comentariosUtils.cargarYRenderizarComentariosPreview(pub.id);
                }
            });

            window.publicacionesUtils.agregarEstilosIndicador();
        } catch (error) {
            container.innerHTML = "<p>Error al cargar tus publicaciones.</p>";
            console.error(error);
        }
    }

    if (filtroEstatusSelect) {
        filtroEstatusSelect.addEventListener('change', (e) => {
            cargarMisPublicaciones(e.target.value);
        });
    }

    const pubContainer = document.getElementById('mis-publicaciones-container');
    if (pubContainer) {
        pubContainer.addEventListener('click', async (e) => {
            const card = e.target.closest('.publicacion-card');
            if (!card) return;

            const publicationIndex = parseInt(card.dataset.index, 10);
            const mediaTarget = e.target.closest('.publicacion-media img, .publicacion-media video, .publicacion-media .media-placeholder-icon');

            if (mediaTarget && !isNaN(publicationIndex)) {
                const pubData = cachedMiPerfilPublications[publicationIndex];
                if (pubData && pubData.multimedia && pubData.multimedia.length > 0) {
                    const mediaIndex = parseInt(mediaTarget.dataset.mediaIndex || '0', 10);
                    lightbox.open(pubData.multimedia, mediaIndex);
                }
                return;
            }

            if (e.target.closest('.reacciones-info')) {
                const publicacionId = card.dataset.id;
                const pubData = cachedMiPerfilPublications[publicationIndex];
                if (pubData && pubData.estatus !== 'aprobada') return;
                window.comentariosUtils.manejarReaccion(publicacionId, card, cachedMiPerfilPublications, publicationIndex);
            }
        });

        pubContainer.addEventListener('submit', async (e) => {
            if (e.target.classList.contains('comentario-form')) {
                const card = e.target.closest('.publicacion-card');
                if (!card) return;
                const publicacionId = card.dataset.id;
                const publicationIndex = parseInt(card.dataset.index, 10);
                const pubData = cachedMiPerfilPublications[publicationIndex];
                if (pubData && pubData.estatus !== 'aprobada') {
                    e.preventDefault(); 
                    return;
                }
                window.comentariosUtils.manejarComentario(e, publicacionId, card, cachedMiPerfilPublications, publicationIndex);
            }
        });
    }

    await window.inicializarBarraNavegacion({ mostrarBuscador: false });
    cargarDatosPerfil();
    cargarMisPublicaciones(); 
});
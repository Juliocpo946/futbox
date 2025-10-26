document.addEventListener('DOMContentLoaded', async () => {
    window.auth.protectRoute();
    const userData = window.auth.getUserData();
    if (!userData || userData.rol !== 'admin') {
        window.location.href = '/';
        return;
    }

    const container = document.getElementById('publicaciones-pendientes-container');
    const modal = document.getElementById('admin-form-modal');
    const modalContentContainer = document.getElementById('modal-form-content');
    const modalMainContent = modal ? modal.querySelector('.admin-modal-content') : null;
    const closeModalBtn = modal ? modal.querySelector('.admin-modal-close') : null;
    const lightbox = new window.MediaLightbox('media-lightbox');
    let cachePublicaciones = [];

    if (!modal || !modalContentContainer || !closeModalBtn || !modalMainContent) {
        console.error('Error: Elementos del modal no encontrados en el HTML.');
        return;
    }

    function ocultarModal() {
        modalContentContainer.innerHTML = '';
        modal.classList.remove('visible');
        modalMainContent.classList.remove('preview-mode');
    }

    closeModalBtn.addEventListener('click', ocultarModal);
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            ocultarModal();
        }
    });

    async function cargarPublicacionesPendientes() {
        try {
            const publicaciones = await window.api.fetchAPI('/admin/publicaciones/pendientes/');
            cachePublicaciones = publicaciones;
            renderTablaPublicaciones(publicaciones);
        } catch (error) {
            container.innerHTML = `<p>Error al cargar las publicaciones: ${error.message}</p>`;
        }
    }

    function renderTablaPublicaciones(publicaciones) {
        if (publicaciones.length === 0) {
            container.innerHTML = '<p>No hay publicaciones pendientes de revisión.</p>';
            return;
        }

        let tableHTML = `
            <table class="admin-table">
                <thead>
                    <tr>
                        <th>Título</th>
                        <th>Autor</th>
                        <th>Fecha</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody>
        `;

        publicaciones.forEach((pub, index) => {
            const fecha = new Date(pub.fecha_publicacion).toLocaleDateString('es-ES');
            tableHTML += `
                <tr id="pub-row-${pub.id}">
                    <td>${pub.titulo}</td>
                    <td>@${pub.autor.nickname}</td>
                    <td>${fecha}</td>
                    <td class="actions-cell">
                        <button class="btn-preview" data-id="${pub.id}" data-index="${index}">Previsualizar</button>
                        <button class="btn-approve" data-id="${pub.id}">Aprobar</button>
                        <button class="btn-reject" data-id="${pub.id}">Rechazar</button>
                    </td>
                </tr>
            `;
        });

        tableHTML += '</tbody></table>';
        container.innerHTML = tableHTML;
    }

    async function mostrarPreviewModal(publicacionId, pubIndex) {
        try {
            const pub = await window.api.fetchAPI(`/publicaciones/${publicacionId}/`);
            if (!pub) {
                alert('No se pudo cargar la publicación.');
                return;
            }

            modalMainContent.classList.add('preview-mode');
            
            const card = window.publicacionesUtils.crearCardPublicacion(pub, pubIndex, true);
            
            modalContentContainer.innerHTML = '';
            modalContentContainer.appendChild(card);
            modal.classList.add('visible');
            
            card.addEventListener('click', (e) => {
                const mediaTarget = e.target.closest('.publicacion-media img, .publicacion-media video');
                if (mediaTarget) {
                    const mediaIndex = parseInt(mediaTarget.dataset.mediaIndex || '0', 10);
                    if (pub.multimedia && pub.multimedia.length > 0) {
                        lightbox.open(pub.multimedia, mediaIndex);
                    }
                }
            });

        } catch (error) {
            alert(`Error al cargar la vista previa: ${error.message}`);
        }
    }

    container.addEventListener('click', async (e) => {
        const target = e.target;
        const publicacionId = target.dataset.id;

        if (!publicacionId) return;

        if (target.classList.contains('btn-approve')) {
            await moderarPublicacion(publicacionId, 'aprobar');
        } else if (target.classList.contains('btn-reject')) {
            await moderarPublicacion(publicacionId, 'rechazar');
        } else if (target.classList.contains('btn-preview')) {
            const pubIndex = parseInt(target.dataset.index, 10);
            await mostrarPreviewModal(publicacionId, pubIndex);
        }
    });

    async function moderarPublicacion(id, accion) {
        try {
            await window.api.fetchAPI(`/admin/publicaciones/${id}/${accion}/`, {
                method: 'PUT'
            });
            const row = document.getElementById(`pub-row-${id}`);
            if (row) {
                row.remove();
            }
            ocultarModal();
        } catch (error) {
            alert(`Error al ${accion} la publicación: ${error.message}`);
        }
    }

    cargarPublicacionesPendientes();
});
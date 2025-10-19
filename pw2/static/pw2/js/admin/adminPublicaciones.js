document.addEventListener('DOMContentLoaded', async () => {
    window.auth.protectRoute();
    const userData = window.auth.getUserData();
    if (!userData || userData.rol !== 'admin') {
        window.location.href = '/';
        return;
    }

    const container = document.getElementById('publicaciones-pendientes-container');

    async function cargarPublicacionesPendientes() {
        try {
            const publicaciones = await window.api.fetchAPI('/admin/publicaciones/pendientes/');
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

        publicaciones.forEach(pub => {
            const fecha = new Date(pub.fecha_publicacion).toLocaleDateString('es-ES');
            tableHTML += `
                <tr id="pub-row-${pub.id}">
                    <td>${pub.titulo}</td>
                    <td>@${pub.autor.nickname}</td>
                    <td>${fecha}</td>
                    <td class="actions-cell">
                        <button class="btn-approve" data-id="${pub.id}">Aprobar</button>
                        <button class="btn-reject" data-id="${pub.id}">Rechazar</button>
                    </td>
                </tr>
            `;
        });

        tableHTML += '</tbody></table>';
        container.innerHTML = tableHTML;
    }

    container.addEventListener('click', async (e) => {
        const target = e.target;
        const publicacionId = target.dataset.id;

        if (!publicacionId) return;

        if (target.classList.contains('btn-approve')) {
            await moderarPublicacion(publicacionId, 'aprobar');
        } else if (target.classList.contains('btn-reject')) {
            await moderarPublicacion(publicacionId, 'rechazar');
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
        } catch (error) {
            alert(`Error al ${accion} la publicación: ${error.message}`);
        }
    }

    cargarPublicacionesPendientes();
});
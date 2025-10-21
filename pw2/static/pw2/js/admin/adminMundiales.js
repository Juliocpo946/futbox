document.addEventListener('DOMContentLoaded', async () => {
    window.auth.protectRoute();
    const userData = window.auth.getUserData();
    if (!userData || userData.rol !== 'admin') {
        window.location.href = '/';
        return;
    }

    const container = document.getElementById('mundiales-container');
    const formContainer = document.getElementById('form-container');
    let todosLosPaises = [];

    async function cargarPaises() {
        try {
            todosLosPaises = await window.api.fetchAPI('/admin/paises/');
        } catch (error) {
            console.error('Error al cargar países:', error);
        }
    }

    async function cargarMundiales() {
        try {
            const mundiales = await window.api.fetchAPI('/admin/mundiales/');
            renderTablaMundiales(mundiales);
        } catch (error) {
            container.innerHTML = `<p>Error al cargar mundiales: ${error.message}</p>`;
        }
    }

    function renderTablaMundiales(mundiales) {
        if (mundiales.length === 0) {
            container.innerHTML = '<p>No hay mundiales registrados.</p>';
            return;
        }

        let tableHTML = `
            <table class="admin-table">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Año</th>
                        <th>Descripción</th>
                        <th>Sedes</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody>
        `;

        mundiales.forEach(mundial => {
            const sedes = mundial.sedes.map(s => s.pais).join(', ');
            tableHTML += `
                <tr id="mundial-row-${mundial.id}">
                    <td>${mundial.id}</td>
                    <td>${mundial.año}</td>
                    <td>${mundial.descripcion.substring(0, 50)}...</td>
                    <td>${sedes}</td>
                    <td class="actions-cell">
                        <button class="btn-approve" data-id="${mundial.id}">Editar</button>
                        <button class="btn-reject" data-id="${mundial.id}">Eliminar</button>
                    </td>
                </tr>
            `;
        });

        tableHTML += '</tbody></table>';
        container.innerHTML = tableHTML;
    }

    function mostrarFormulario(mundial = null) {
        const paisesOptions = todosLosPaises.map(p => {
            const selected = mundial && mundial.sedes.some(s => s.id === p.id) ? 'selected' : '';
            return `<option value="${p.id}" ${selected}>${p.pais}</option>`;
        }).join('');

        formContainer.innerHTML = `
            <form id="mundial-form">
                <h2>${mundial ? 'Editar Mundial' : 'Nuevo Mundial'}</h2>
                <div class="input-group">
                    <label for="año-mundial">Año</label>
                    <input type="number" id="año-mundial" value="${mundial ? mundial.año : ''}" required>
                </div>
                <div class="input-group">
                    <label for="descripcion-mundial">Descripción</label>
                    <textarea id="descripcion-mundial" rows="4" required>${mundial ? mundial.descripcion : ''}</textarea>
                </div>
                <div class="input-group">
                    <label for="sedes-mundial">Sedes (mantén Ctrl para múltiple)</label>
                    <select id="sedes-mundial" multiple size="5">
                        ${paisesOptions}
                    </select>
                </div>
                <div class="form-actions">
                    <button type="button" class="btn-cancelar" id="btn-cancelar">Cancelar</button>
                    <button type="submit" class="btn-publicar">${mundial ? 'Actualizar' : 'Crear'}</button>
                </div>
            </form>
        `;

        document.getElementById('btn-cancelar').addEventListener('click', () => {
            formContainer.innerHTML = '';
        });

        document.getElementById('mundial-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const año = parseInt(document.getElementById('año-mundial').value);
            const descripcion = document.getElementById('descripcion-mundial').value.trim();
            const sedesSelect = document.getElementById('sedes-mundial');
            const sedes = Array.from(sedesSelect.selectedOptions).map(opt => parseInt(opt.value));

            try {
                if (mundial) {
                    await window.api.fetchAPI(`/admin/mundiales/${mundial.id}/`, {
                        method: 'PUT',
                        body: JSON.stringify({ año, descripcion, sedes })
                    });
                } else {
                    await window.api.fetchAPI('/admin/mundiales/', {
                        method: 'POST',
                        body: JSON.stringify({ año, descripcion, sedes })
                    });
                }
                formContainer.innerHTML = '';
                cargarMundiales();
            } catch (error) {
                alert(`Error: ${error.message}`);
            }
        });
    }

    container.addEventListener('click', async (e) => {
        const mundialId = e.target.dataset.id;
        if (!mundialId) return;

        if (e.target.classList.contains('btn-approve')) {
            try {
                const mundial = await window.api.fetchAPI(`/admin/mundiales/${mundialId}/`);
                mostrarFormulario(mundial);
            } catch (error) {
                alert(`Error: ${error.message}`);
            }
        } else if (e.target.classList.contains('btn-reject')) {
            if (confirm('¿Estás seguro de eliminar este mundial?')) {
                try {
                    await window.api.fetchAPI(`/admin/mundiales/${mundialId}/`, {
                        method: 'DELETE'
                    });
                    cargarMundiales();
                } catch (error) {
                    alert(`Error: ${error.message}`);
                }
            }
        }
    });

    const btnNuevo = document.getElementById('btn-nuevo-mundial');
    if (btnNuevo) {
        btnNuevo.addEventListener('click', () => mostrarFormulario());
    }

    await cargarPaises();
    cargarMundiales();
});
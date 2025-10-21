document.addEventListener('DOMContentLoaded', async () => {
    window.auth.protectRoute();
    const userData = window.auth.getUserData();
    if (!userData || userData.rol !== 'admin') {
        window.location.href = '/';
        return;
    }

    const container = document.getElementById('paises-container');
    const formContainer = document.getElementById('form-container');

    async function cargarPaises() {
        try {
            const paises = await window.api.fetchAPI('/admin/paises/');
            renderTablaPaises(paises);
        } catch (error) {
            container.innerHTML = `<p>Error al cargar países: ${error.message}</p>`;
        }
    }

    function renderTablaPaises(paises) {
        if (paises.length === 0) {
            container.innerHTML = '<p>No hay países registrados.</p>';
            return;
        }

        let tableHTML = `
            <table class="admin-table">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>País</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody>
        `;

        paises.forEach(pais => {
            tableHTML += `
                <tr id="pais-row-${pais.id}">
                    <td>${pais.id}</td>
                    <td>${pais.pais}</td>
                    <td class="actions-cell">
                        <button class="btn-approve" data-id="${pais.id}">Editar</button>
                        <button class="btn-reject" data-id="${pais.id}">Eliminar</button>
                    </td>
                </tr>
            `;
        });

        tableHTML += '</tbody></table>';
        container.innerHTML = tableHTML;
    }

    function mostrarFormulario(pais = null) {
        formContainer.innerHTML = `
            <form id="pais-form">
                <h2>${pais ? 'Editar País' : 'Nuevo País'}</h2>
                <div class="input-group">
                    <label for="nombre-pais">Nombre del País</label>
                    <input type="text" id="nombre-pais" value="${pais ? pais.pais : ''}" required>
                </div>
                <div class="form-actions">
                    <button type="button" class="btn-cancelar" id="btn-cancelar">Cancelar</button>
                    <button type="submit" class="btn-publicar">${pais ? 'Actualizar' : 'Crear'}</button>
                </div>
            </form>
        `;

        document.getElementById('btn-cancelar').addEventListener('click', () => {
            formContainer.innerHTML = '';
        });

        document.getElementById('pais-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const nombre = document.getElementById('nombre-pais').value.trim();

            try {
                if (pais) {
                    await window.api.fetchAPI(`/admin/paises/${pais.id}/`, {
                        method: 'PUT',
                        body: JSON.stringify({ pais: nombre })
                    });
                } else {
                    await window.api.fetchAPI('/admin/paises/', {
                        method: 'POST',
                        body: JSON.stringify({ pais: nombre })
                    });
                }
                formContainer.innerHTML = '';
                cargarPaises();
            } catch (error) {
                alert(`Error: ${error.message}`);
            }
        });
    }

    container.addEventListener('click', async (e) => {
        const paisId = e.target.dataset.id;
        if (!paisId) return;

        if (e.target.classList.contains('btn-approve')) {
            try {
                const pais = await window.api.fetchAPI(`/admin/paises/`);
                const paisEditar = pais.find(p => p.id == paisId);
                if (paisEditar) {
                    mostrarFormulario(paisEditar);
                }
            } catch (error) {
                alert(`Error: ${error.message}`);
            }
        } else if (e.target.classList.contains('btn-reject')) {
            if (confirm('¿Estás seguro de eliminar este país?')) {
                try {
                    await window.api.fetchAPI(`/admin/paises/${paisId}/`, {
                        method: 'DELETE'
                    });
                    cargarPaises();
                } catch (error) {
                    alert(`Error: ${error.message}`);
                }
            }
        }
    });

    const btnNuevo = document.getElementById('btn-nuevo-pais');
    if (btnNuevo) {
        btnNuevo.addEventListener('click', () => mostrarFormulario());
    }

    cargarPaises();
});
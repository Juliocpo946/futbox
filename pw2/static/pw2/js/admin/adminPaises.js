document.addEventListener('DOMContentLoaded', async () => {
    window.auth.protectRoute();
    const userData = window.auth.getUserData();
    if (!userData || userData.rol !== 'admin') {
        window.location.href = '/';
        return;
    }

    const container = document.getElementById('paises-container');
    const modal = document.getElementById('admin-form-modal');
    const modalContentContainer = document.getElementById('modal-form-content');
    const modalMainContent = modal ? modal.querySelector('.admin-modal-content') : null;
    const closeModalBtn = modal ? modal.querySelector('.admin-modal-close') : null;

    if (!modal || !modalContentContainer || !closeModalBtn || !modalMainContent) {
        console.error('Error: Elementos del modal no encontrados en el HTML.');
        return;
    }

    function ocultarModal() {
        modalContentContainer.innerHTML = '';
        modal.classList.remove('visible');
        modalMainContent.classList.remove('simple-form');
    }

    closeModalBtn.addEventListener('click', ocultarModal);
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            ocultarModal();
        }
    });

    async function cargarPaises() {
        try {
            const paises = await window.api.fetchAPI('/admin/paises/');
            renderTablaPaises(paises);
        } catch (error) {
           if(container) container.innerHTML = `<p>Error al cargar países: ${error.message}</p>`;
        }
    }

    function renderTablaPaises(paises) {
        if (!container) return;
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
        modalMainContent.classList.add('simple-form');
        modalContentContainer.innerHTML = `
            <form id="pais-form">
                <h2>${pais ? 'Editar País' : 'Nuevo País'}</h2>
                <div class="input-group">
                    <label for="nombre-pais">Nombre del País</label>
                    <input type="text" id="nombre-pais" value="${pais ? pais.pais : ''}" required>
                </div>
                <div class="form-actions">
                    <button type="button" class="btn-cancelar" id="btn-cancelar-modal">Cancelar</button>
                    <button type="submit" class="btn-publicar">${pais ? 'Actualizar' : 'Crear'}</button>
                </div>
            </form>
        `;
        modal.classList.add('visible');

        const cancelarBtn = document.getElementById('btn-cancelar-modal');
        if(cancelarBtn) cancelarBtn.addEventListener('click', ocultarModal);

        const paisForm = document.getElementById('pais-form');
        if (paisForm) {
            paisForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const nombreInput = document.getElementById('nombre-pais');
                const nombre = nombreInput ? nombreInput.value.trim() : '';
                const submitButton = e.target.querySelector('button[type="submit"]');
                if(submitButton) submitButton.disabled = true;

                if (!nombre) {
                     alert('El nombre del país no puede estar vacío.');
                     if(submitButton) submitButton.disabled = false;
                     return;
                }


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
                    ocultarModal();
                    cargarPaises();
                } catch (error) {
                    alert(`Error: ${error.message}`);
                    if(submitButton) submitButton.disabled = false;
                }
            });
        }
    }

    if (container) {
        container.addEventListener('click', async (e) => {
            const targetButton = e.target.closest('button');
            if (!targetButton) return;
            const paisId = targetButton.dataset.id;
            if (!paisId) return;

            if (targetButton.classList.contains('btn-approve')) {
                try {
                    const paises = await window.api.fetchAPI(`/admin/paises/`);
                    const paisEditar = paises.find(p => p.id == paisId);
                    if (paisEditar) {
                        mostrarFormulario(paisEditar);
                    } else {
                         alert('País no encontrado para editar.');
                    }
                } catch (error) {
                    alert(`Error al obtener datos para editar: ${error.message}`);
                }
            } else if (targetButton.classList.contains('btn-reject')) {
                if (confirm('¿Estás seguro de eliminar este país?')) {
                    try {
                        await window.api.fetchAPI(`/admin/paises/${paisId}/`, {
                            method: 'DELETE'
                        });
                        cargarPaises();
                    } catch (error) {
                        alert(`Error al eliminar: ${error.message}`);
                    }
                }
            }
        });
    }

    const btnNuevoPais = document.getElementById('btn-nuevo-pais');
    if (btnNuevoPais) {
        btnNuevoPais.addEventListener('click', () => mostrarFormulario());
    } else {
        console.error('Botón #btn-nuevo-pais no encontrado.');
    }

    cargarPaises();
});
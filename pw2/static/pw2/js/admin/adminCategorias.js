document.addEventListener('DOMContentLoaded', async () => {
    window.auth.protectRoute();
    const userData = window.auth.getUserData();
    if (!userData || userData.rol !== 'admin') {
        window.location.href = '/';
        return;
    }

    const container = document.getElementById('categorias-container');
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

    async function cargarCategorias() {
        try {
            const categorias = await window.api.fetchAPI('/admin/categorias/');
            renderTablaCategorias(categorias);
        } catch (error) {
            if(container) container.innerHTML = `<p>Error al cargar categorías: ${error.message}</p>`;
        }
    }

    function renderTablaCategorias(categorias) {
         if (!container) return;
        if (categorias.length === 0) {
            container.innerHTML = '<p>No hay categorías registradas.</p>';
            return;
        }

        let tableHTML = `
            <table class="admin-table">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Nombre</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody>
        `;

        categorias.forEach(cat => {
            tableHTML += `
                <tr id="cat-row-${cat.id}">
                    <td>${cat.id}</td>
                    <td>${cat.nombre}</td>
                    <td class="actions-cell">
                        <button class="btn-approve" data-id="${cat.id}">Editar</button>
                        <button class="btn-reject" data-id="${cat.id}">Eliminar</button>
                    </td>
                </tr>
            `;
        });

        tableHTML += '</tbody></table>';
        container.innerHTML = tableHTML;
    }

    function mostrarFormulario(categoria = null) {
        modalMainContent.classList.add('simple-form');
        modalContentContainer.innerHTML = `
            <form id="categoria-form">
                <h2>${categoria ? 'Editar Categoría' : 'Nueva Categoría'}</h2>
                <div class="input-group">
                    <label for="nombre-categoria">Nombre</label>
                    <input type="text" id="nombre-categoria" value="${categoria ? categoria.nombre : ''}" required>
                </div>
                <div class="form-actions">
                    <button type="button" class="btn-cancelar" id="btn-cancelar-modal">Cancelar</button>
                    <button type="submit" class="btn-publicar">${categoria ? 'Actualizar' : 'Crear'}</button>
                </div>
            </form>
        `;
        modal.classList.add('visible');

        const cancelarBtn = document.getElementById('btn-cancelar-modal');
        if(cancelarBtn) cancelarBtn.addEventListener('click', ocultarModal);

        const categoriaForm = document.getElementById('categoria-form');
        if(categoriaForm) {
            categoriaForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const nombreInput = document.getElementById('nombre-categoria');
                const nombre = nombreInput ? nombreInput.value.trim() : '';
                const submitButton = e.target.querySelector('button[type="submit"]');
                if(submitButton) submitButton.disabled = true;

                if (!nombre) {
                     alert('El nombre de la categoría no puede estar vacío.');
                     if(submitButton) submitButton.disabled = false;
                     return;
                }

                try {
                    if (categoria) {
                        await window.api.fetchAPI(`/admin/categorias/${categoria.id}/`, {
                            method: 'PUT',
                            body: JSON.stringify({ nombre })
                        });
                    } else {
                        await window.api.fetchAPI('/admin/categorias/', {
                            method: 'POST',
                            body: JSON.stringify({ nombre })
                        });
                    }
                    ocultarModal();
                    cargarCategorias();
                } catch (error) {
                    alert(`Error: ${error.message}`);
                    if(submitButton) submitButton.disabled = false;
                }
            });
        }
    }

    if(container) {
        container.addEventListener('click', async (e) => {
             const targetButton = e.target.closest('button');
             if (!targetButton) return;
            const catId = targetButton.dataset.id;
            if (!catId) return;

            if (targetButton.classList.contains('btn-approve')) {
                try {
                    const categorias = await window.api.fetchAPI(`/admin/categorias/`);
                    const catEditar = categorias.find(c => c.id == catId);
                     if (catEditar) {
                        mostrarFormulario(catEditar);
                     } else {
                        alert('Categoría no encontrada para editar.');
                     }
                } catch (error) {
                    alert(`Error al obtener datos para editar: ${error.message}`);
                }
            } else if (targetButton.classList.contains('btn-reject')) {
                if (confirm('¿Estás seguro de eliminar esta categoría?')) {
                    try {
                        await window.api.fetchAPI(`/admin/categorias/${catId}/`, {
                            method: 'DELETE'
                        });
                        cargarCategorias();
                    } catch (error) {
                        alert(`Error al eliminar: ${error.message}`);
                    }
                }
            }
        });
    }


    const btnNuevaCategoria = document.getElementById('btn-nueva-categoria');
    if(btnNuevaCategoria) {
        btnNuevaCategoria.addEventListener('click', () => mostrarFormulario());
    } else {
        console.error('Botón #btn-nueva-categoria no encontrado.');
    }

    cargarCategorias();
});
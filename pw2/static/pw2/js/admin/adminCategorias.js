document.addEventListener('DOMContentLoaded', async () => {
    window.auth.protectRoute();
    const userData = window.auth.getUserData();
    if (!userData || userData.rol !== 'admin') {
        window.location.href = '/';
        return;
    }

    const container = document.getElementById('categorias-container');
    const formContainer = document.getElementById('form-container');

    async function cargarCategorias() {
        try {
            const categorias = await window.api.fetchAPI('/admin/categorias/');
            renderTablaCategorias(categorias);
        } catch (error) {
            container.innerHTML = `<p>Error al cargar categorías: ${error.message}</p>`;
        }
    }

    function renderTablaCategorias(categorias) {
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
        formContainer.innerHTML = `
            <form id="categoria-form">
                <h2>${categoria ? 'Editar Categoría' : 'Nueva Categoría'}</h2>
                <div class="input-group">
                    <label for="nombre-categoria">Nombre</label>
                    <input type="text" id="nombre-categoria" value="${categoria ? categoria.nombre : ''}" required>
                </div>
                <div class="form-actions">
                    <button type="button" class="btn-cancelar" id="btn-cancelar">Cancelar</button>
                    <button type="submit" class="btn-publicar">${categoria ? 'Actualizar' : 'Crear'}</button>
                </div>
            </form>
        `;

        document.getElementById('btn-cancelar').addEventListener('click', () => {
            formContainer.innerHTML = '';
        });

        document.getElementById('categoria-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const nombre = document.getElementById('nombre-categoria').value.trim();

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
                formContainer.innerHTML = '';
                cargarCategorias();
            } catch (error) {
                alert(`Error: ${error.message}`);
            }
        });
    }

    container.addEventListener('click', async (e) => {
        const catId = e.target.dataset.id;
        if (!catId) return;

        if (e.target.classList.contains('btn-approve')) {
            try {
                const categorias = await window.api.fetchAPI(`/admin/categorias/`);
                const catEditar = categorias.find(c => c.id == catId);
                if (catEditar) {
                    mostrarFormulario(catEditar);
                }
            } catch (error) {
                alert(`Error: ${error.message}`);
            }
        } else if (e.target.classList.contains('btn-reject')) {
            if (confirm('¿Estás seguro de eliminar esta categoría?')) {
                try {
                    await window.api.fetchAPI(`/admin/categorias/${catId}/`, {
                        method: 'DELETE'
                    });
                    cargarCategorias();
                } catch (error) {
                    alert(`Error: ${error.message}`);
                }
            }
        }
    });

    const btnNuevo = document.getElementById('btn-nueva-categoria');
    if (btnNuevo) {
        btnNuevo.addEventListener('click', () => mostrarFormulario());
    }

    cargarCategorias();
});
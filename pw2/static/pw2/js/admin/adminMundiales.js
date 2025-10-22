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
                        <th>Nombre</th>
                        <th>Año</th>
                        <th>Sedes</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody>
        `;

        mundiales.forEach(mundial => {
            const sedes = mundial.sedes.map(s => s.pais).join(', ');
            tableHTML += `
                <tr id="mundial-row-${mundial.id}" data-id="${mundial.id}">
                    <td>${mundial.nombre || 'Sin Nombre'}</td>
                    <td>${mundial.año}</td>
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
        formContainer.innerHTML = `
            <form id="mundial-form">
                <h2>${mundial ? 'Editar Mundial' : 'Nuevo Mundial'}</h2>
                <div class="form-layout">
                    <div class="form-col-30">
                        <div class="image-preview-container">
                            <img src="${mundial?.imagen?.path || ''}" id="image-preview" class="image-preview" style="${!mundial?.imagen?.path && 'display:none;'}">
                            <span id="image-preview-label" style="${mundial?.imagen?.path && 'display:none;'}">Sin imagen</span>
                        </div>
                        <input type="file" id="input-imagen" accept="image/*" style="display: none;">
                        <button type="button" class="btn-publicar" id="btn-upload-image">Subir Imagen</button>
                    </div>
                    <div class="form-col-70">
                        <div class="input-group">
                            <label for="nombre-mundial">Nombre del Mundial</label>
                            <input type="text" id="nombre-mundial" value="${mundial?.nombre || ''}" required>
                        </div>
                        <div class="input-group">
                            <label for="año-mundial">Año</label>
                            <input type="number" id="año-mundial" value="${mundial?.año || ''}" required>
                        </div>
                        <div class="input-group">
                            <label for="descripcion-mundial">Descripción</label>
                            <textarea id="descripcion-mundial" rows="4" required>${mundial?.descripcion || ''}</textarea>
                        </div>
                        <div class="input-group">
                            <label>Sedes</label>
                            <div class="country-selector-container">
                                <div id="available-countries" class="country-list-box"><h4>Disponibles</h4></div>
                                <div id="selected-countries" class="country-list-box"><h4>Seleccionadas</h4></div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="form-actions">
                    <button type="button" class="btn-cancelar" id="btn-cancelar">Cancelar</button>
                    <button type="submit" class="btn-publicar">${mundial ? 'Actualizar' : 'Crear'}</button>
                </div>
            </form>
        `;

        const availableBox = document.getElementById('available-countries');
        const selectedBox = document.getElementById('selected-countries');
        let selectedPaises = new Map(mundial ? mundial.sedes.map(s => [s.id, s]) : []);

        const renderPaises = () => {
            availableBox.innerHTML = '<h4>Disponibles</h4>';
            selectedBox.innerHTML = '<h4>Seleccionadas</h4>';

            todosLosPaises.forEach(p => {
                if (!selectedPaises.has(p.id)) {
                    const item = document.createElement('div');
                    item.className = 'country-item';
                    item.textContent = p.pais;
                    item.dataset.id = p.id;
                    item.onclick = () => {
                        selectedPaises.set(p.id, p);
                        renderPaises();
                    };
                    availableBox.appendChild(item);
                }
            });

            selectedPaises.forEach(p => {
                const item = document.createElement('div');
                item.className = 'country-item';
                item.innerHTML = `<span>${p.pais}</span><button type="button" class="remove-country-btn">&times;</button>`;
                item.querySelector('.remove-country-btn').onclick = () => {
                    selectedPaises.delete(p.id);
                    renderPaises();
                };
                selectedBox.appendChild(item);
            });
        };

        renderPaises();

        document.getElementById('btn-upload-image').addEventListener('click', () => {
            document.getElementById('input-imagen').click();
        });

        document.getElementById('input-imagen').addEventListener('change', (e) => {
            if (e.target.files && e.target.files[0]) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    document.getElementById('image-preview').src = event.target.result;
                    document.getElementById('image-preview').style.display = 'block';
                    document.getElementById('image-preview-label').style.display = 'none';
                };
                reader.readAsDataURL(e.target.files[0]);
            }
        });

        document.getElementById('btn-cancelar').addEventListener('click', () => {
            formContainer.innerHTML = '';
        });

        document.getElementById('mundial-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const formData = new FormData();
            formData.append('nombre', document.getElementById('nombre-mundial').value);
            formData.append('año', document.getElementById('año-mundial').value);
            formData.append('descripcion', document.getElementById('descripcion-mundial').value);
            
            const sedesIds = Array.from(selectedPaises.keys());
            sedesIds.forEach(id => formData.append('sedes', id));
            
            const imagenInput = document.getElementById('input-imagen');
            if (imagenInput.files[0]) {
                formData.append('imagen', imagenInput.files[0]);
            }

            try {
                if (mundial) {
                    await window.api.fetchAPI(`/admin/mundiales/${mundial.id}/`, {
                        method: 'POST',
                        body: formData
                    });
                } else {
                    await window.api.fetchAPI('/admin/mundiales/', {
                        method: 'POST',
                        body: formData
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
        const mundialId = e.target.closest('tr')?.dataset.id || e.target.dataset.id;
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
    
    document.getElementById('btn-nuevo-mundial').addEventListener('click', () => mostrarFormulario());

    await cargarPaises();
    cargarMundiales();
});
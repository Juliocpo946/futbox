document.addEventListener('DOMContentLoaded', async () => {
    window.auth.protectRoute();
    const userData = window.auth.getUserData();
    if (!userData || userData.rol !== 'admin') {
        window.location.href = '/';
        return;
    }

    const container = document.getElementById('mundiales-container');
    const modal = document.getElementById('admin-form-modal');
    const modalContentContainer = document.getElementById('modal-form-content');
    const modalMainContent = modal ? modal.querySelector('.admin-modal-content') : null;
    const closeModalBtn = modal ? modal.querySelector('.admin-modal-close') : null;
    let todosLosPaises = [];

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
            todosLosPaises = await window.api.fetchAPI('/admin/paises/');
        } catch (error) {
            console.error('Error al cargar países:', error);
            alert('No se pudieron cargar los países. La selección de sedes no funcionará.');
        }
    }

    async function cargarMundiales() {
        try {
            const mundiales = await window.api.fetchAPI('/admin/mundiales/');
            renderTablaMundiales(mundiales);
        } catch (error) {
             if (container) container.innerHTML = `<p>Error al cargar mundiales: ${error.message}</p>`;
        }
    }

    function renderTablaMundiales(mundiales) {
        if (!container) return;
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
            const sedes = mundial.sedes.map(s => s.pais).join(', ') || 'N/A';
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
        modalMainContent.classList.remove('simple-form');
        modalContentContainer.innerHTML = `
            <form id="mundial-form">
                <h2>${mundial ? 'Editar Mundial' : 'Nuevo Mundial'}</h2>
                <div class="form-layout">
                    <div class="form-col-30">
                        <div class="image-preview-container">
                            <img src="${mundial?.imagen?.path || ''}" id="image-preview" class="image-preview" style="${!mundial?.imagen?.path ? 'display:none;' : ''}">
                            <span id="image-preview-label" style="${mundial?.imagen?.path ? 'display:none;' : ''}">Sin imagen</span>
                        </div>
                        <input type="file" id="input-imagen" accept="image/*" style="display: none;">
                        <button type="button" class="btn-publicar" id="btn-upload-image">Subir/Cambiar Imagen</button>
                    </div>
                    <div class="form-col-70">
                        <div class="input-row">
                            <div class="input-group">
                                <label for="nombre-mundial">Nombre del Mundial</label>
                                <input type="text" id="nombre-mundial" value="${mundial?.nombre || ''}">
                            </div>
                            <div class="input-group">
                                <label for="año-mundial">Año</label>
                                <input type="number" id="año-mundial" value="${mundial?.año || ''}" required>
                            </div>
                        </div>
                        <div class="input-group">
                            <label for="descripcion-mundial">Descripción</label>
                            <textarea id="descripcion-mundial" rows="3" required>${mundial?.descripcion || ''}</textarea>
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
                    <button type="button" class="btn-cancelar" id="btn-cancelar-modal">Cancelar</button>
                    <button type="submit" class="btn-publicar">${mundial ? 'Actualizar' : 'Crear'}</button>
                </div>
            </form>
        `;
        modal.classList.add('visible');

        const availableBox = document.getElementById('available-countries');
        const selectedBox = document.getElementById('selected-countries');
        let selectedPaises = new Map(mundial ? mundial.sedes.map(s => [s.id, s]) : []);

        const renderPaises = () => {
             if (!availableBox || !selectedBox) return;
            availableBox.innerHTML = '<h4>Disponibles</h4>';
            selectedBox.innerHTML = '<h4>Seleccionadas</h4>';

            todosLosPaises.sort((a, b) => a.pais.localeCompare(b.pais)).forEach(p => {
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

            Array.from(selectedPaises.values()).sort((a, b) => a.pais.localeCompare(b.pais)).forEach(p => {
                const item = document.createElement('div');
                item.className = 'country-item';
                item.innerHTML = `<span>${p.pais}</span><button type="button" class="remove-country-btn" data-id="${p.id}">&times;</button>`;
                const removeBtn = item.querySelector('.remove-country-btn');
                if(removeBtn) {
                    removeBtn.onclick = (e) => {
                        e.stopPropagation();
                        selectedPaises.delete(p.id);
                        renderPaises();
                    };
                }
                selectedBox.appendChild(item);
            });
        };

        renderPaises();

        const uploadBtn = document.getElementById('btn-upload-image');
        if(uploadBtn) {
            uploadBtn.addEventListener('click', () => {
                const inputImg = document.getElementById('input-imagen');
                if(inputImg) inputImg.click();
            });
        }


        const inputImagen = document.getElementById('input-imagen');
         if(inputImagen) {
            inputImagen.addEventListener('change', (e) => {
                if (e.target.files && e.target.files[0]) {
                    const reader = new FileReader();
                    reader.onload = (event) => {
                         const preview = document.getElementById('image-preview');
                         const label = document.getElementById('image-preview-label');
                         if(preview && event.target) preview.src = event.target.result;
                         if(preview) preview.style.display = 'block';
                         if(label) label.style.display = 'none';
                    };
                    reader.readAsDataURL(e.target.files[0]);
                }
            });
         }

        const cancelarBtnModal = document.getElementById('btn-cancelar-modal');
        if(cancelarBtnModal) cancelarBtnModal.addEventListener('click', ocultarModal);

        const mundialForm = document.getElementById('mundial-form');
        if(mundialForm) {
            mundialForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const submitButton = e.target.querySelector('button[type="submit"]');
                if(submitButton) submitButton.disabled = true;

                const formData = new FormData();
                const nombreInput = document.getElementById('nombre-mundial');
                const anioInput = document.getElementById('año-mundial');
                const descInput = document.getElementById('descripcion-mundial');
                const imagenInputSubmit = document.getElementById('input-imagen');

                const añoValue = anioInput ? anioInput.value : '';
                const descValue = descInput ? descInput.value : '';

                if (!añoValue || !descValue) {
                    alert('El año y la descripción son obligatorios.');
                    if(submitButton) submitButton.disabled = false;
                    return;
                }


                if (nombreInput) formData.append('nombre', nombreInput.value);
                formData.append('año', añoValue);
                formData.append('descripcion', descValue);


                const sedesIds = Array.from(selectedPaises.keys());
                sedesIds.forEach(id => formData.append('sedes', id));

                if (imagenInputSubmit && imagenInputSubmit.files[0]) {
                    formData.append('imagen', imagenInputSubmit.files[0]);
                } else if (mundial && !mundial.imagen) {
                    formData.append('imagen', '');
                }


                try {
                    const url = mundial ? `/admin/mundiales/${mundial.id}/` : '/admin/mundiales/';
                    const method = 'POST';

                    await window.api.fetchAPI(url, {
                        method: method,
                        body: formData,
                        headers: {}
                    });
                    ocultarModal();
                    cargarMundiales();
                } catch (error) {
                    alert(`Error al guardar Mundial: ${error.message}`);
                     if(submitButton) submitButton.disabled = false;
                }
            });
        }
    }

    if (container) {
        container.addEventListener('click', async (e) => {
            const targetButton = e.target.closest('button');
             if (!targetButton) return;
            const mundialId = targetButton.dataset.id || targetButton.closest('tr')?.dataset.id;

            if (!mundialId) return;

            if (targetButton.classList.contains('btn-approve')) {
                try {
                    const mundial = await window.api.fetchAPI(`/admin/mundiales/${mundialId}/`);
                    if(mundial) {
                       mostrarFormulario(mundial);
                    } else {
                        alert('Mundial no encontrado para editar.');
                    }
                } catch (error) {
                    alert(`Error al obtener datos para editar: ${error.message}`);
                }
            } else if (targetButton.classList.contains('btn-reject')) {
                if (confirm('¿Estás seguro de eliminar este mundial?')) {
                    try {
                        await window.api.fetchAPI(`/admin/mundiales/${mundialId}/`, {
                            method: 'DELETE'
                        });
                        cargarMundiales();
                    } catch (error) {
                        alert(`Error al eliminar: ${error.message}`);
                    }
                }
            }
        });
    }

    const btnNuevoMundial = document.getElementById('btn-nuevo-mundial');
     if(btnNuevoMundial) {
        btnNuevoMundial.addEventListener('click', () => mostrarFormulario());
     } else {
        console.error('Botón #btn-nuevo-mundial no encontrado.');
     }

    await cargarPaises();
    cargarMundiales();
});
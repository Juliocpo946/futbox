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
    let selectedFiles = [];
    let currentCarouselIndex = 0;

    if (!modal || !modalContentContainer || !closeModalBtn || !modalMainContent) {
        console.error('Error: Elementos del modal no encontrados en el HTML.');
        return;
    }

    function ocultarModal() {
        modalContentContainer.innerHTML = '';
        modal.classList.remove('visible');
        modalMainContent.classList.remove('simple-form');
        selectedFiles = [];
        currentCarouselIndex = 0;
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

    function renderNewPreview() {
        const previewContainer = document.getElementById('preview-container-new');
        if (!previewContainer) return;
        previewContainer.innerHTML = '';
        selectedFiles.forEach((file, index) => {
            const reader = new FileReader();
            const previewItem = document.createElement('div');
            previewItem.className = 'preview-item';

            reader.onload = function(e) {
                let mediaElement;
                if (file.type.startsWith('image/')) {
                    mediaElement = document.createElement('img');
                } else if (file.type.startsWith('video/')) {
                    mediaElement = document.createElement('video');
                    mediaElement.muted = true;
                } else {
                    mediaElement = document.createElement('div');
                    mediaElement.textContent = '...';
                }
                if(e.target && mediaElement.tagName !== 'DIV') mediaElement.src = e.target.result;
                previewItem.appendChild(mediaElement);

                const removeBtn = document.createElement('button');
                removeBtn.className = 'remove-btn';
                removeBtn.innerHTML = '&times;';
                removeBtn.type = 'button';
                removeBtn.onclick = () => {
                    selectedFiles.splice(index, 1);
                    const dataTransfer = new DataTransfer();
                    selectedFiles.forEach(f => dataTransfer.items.add(f));
                    const input = document.getElementById('input-imagenes');
                    if (input) input.files = dataTransfer.files;

                    renderNewPreview();
                    const existingPreviewContainer = document.querySelector('.image-preview-container');
                    const noMediaLabel = document.getElementById('image-preview-label');
                    if (selectedFiles.length === 0 && existingPreviewContainer?.style.display === 'none' && noMediaLabel) {
                        noMediaLabel.style.display = 'block';
                    }
                };
                previewItem.appendChild(removeBtn);
            }
            if (file.type.startsWith('image/') || file.type.startsWith('video/')) {
                reader.readAsDataURL(file);
            } else {
                 reader.onload({ target: null });
            }
            previewContainer.appendChild(previewItem);
        });
        const noMediaLabel = document.getElementById('image-preview-label');
        if (noMediaLabel && selectedFiles.length > 0) {
            noMediaLabel.style.display = 'none';
        }
    }

    function showExistingMediaSlide(mundialMultimedia, index) {
        const previewContainer = document.querySelector('.image-preview-container');
        if (!previewContainer || !mundialMultimedia || mundialMultimedia.length === 0) return;

        currentCarouselIndex = index;
        const item = mundialMultimedia[index];
        let mediaHTML = '';

        if (item.media_type === 'image') {
            mediaHTML = `<img src="${item.path}" class="image-preview">`;
        } else if (item.media_type === 'video') {
            mediaHTML = `<video src="${item.path}" class="image-preview" controls muted></video>`;
        } else {
            mediaHTML = `<span class="image-preview-label">Archivo no soportado</span>`;
        }

        let controlsHTML = '';
        if (mundialMultimedia.length > 1) {
            controlsHTML = `
                <button type="button" class="mini-carousel-control prev" ${index === 0 ? 'disabled' : ''}>&#10094;</button>
                <button type="button" class="mini-carousel-control next" ${index === mundialMultimedia.length - 1 ? 'disabled' : ''}>&#10095;</button>
            `;
        }

        previewContainer.innerHTML = mediaHTML + controlsHTML;

        previewContainer.querySelector('.prev')?.addEventListener('click', () => showExistingMediaSlide(mundialMultimedia, currentCarouselIndex - 1));
        previewContainer.querySelector('.next')?.addEventListener('click', () => showExistingMediaSlide(mundialMultimedia, currentCarouselIndex + 1));
    }


    function mostrarFormulario(mundial = null) {
        selectedFiles = [];
        currentCarouselIndex = 0;
        modalMainContent.classList.remove('simple-form');

        let initialPreviewHTML = `<span id="image-preview-label" style="display: block;">Sin multimedia</span>`; 

        modalContentContainer.innerHTML = `
            <form id="mundial-form">
                <h2>${mundial ? 'Editar Mundial' : 'Nuevo Mundial'}</h2>
                <div class="form-layout">
                    <div class="form-col-30">
                        <div class="image-preview-container">
                            ${initialPreviewHTML}
                        </div>
                        <input type="file" id="input-imagenes" accept="image/*,video/*" multiple style="display: none;">
                        <button type="button" class="btn-publicar" id="btn-upload-image">${mundial ? 'Subir Nuevos Archivos' : 'Subir Archivos'}</button>
                        <p style="font-size: 0.8em; color: #555; margin-top: 5px;">${mundial ? 'Subir nuevos archivos reemplazará todos los existentes.' : ''}</p>
                        <div id="preview-container-new" class="preview-container" style="margin-top: 10px; flex-wrap: wrap; gap: 5px; max-height: 100px; overflow-y: auto;"></div>
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

        if (mundial?.multimedia && mundial.multimedia.length > 0) {
            const noMediaLabel = document.getElementById('image-preview-label');
            if (noMediaLabel) noMediaLabel.style.display = 'none'; 
            showExistingMediaSlide(mundial.multimedia, 0); 
        }

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
                const inputImg = document.getElementById('input-imagenes');
                if(inputImg) inputImg.click();
            });
        }


        const inputImagenes = document.getElementById('input-imagenes');
         if(inputImagenes) {
            inputImagenes.addEventListener('change', (e) => {
                const existingPreviewContainer = document.querySelector('.image-preview-container');
                const newPreviewContainer = document.getElementById('preview-container-new');
                const noMediaLabel = document.getElementById('image-preview-label');

                if (e.target.files && e.target.files.length > 0) {
                    if(existingPreviewContainer) existingPreviewContainer.style.display = 'none';
                    if (noMediaLabel) noMediaLabel.style.display = 'none';
                    if(newPreviewContainer) newPreviewContainer.style.display = 'flex'; 

                    const newFiles = Array.from(e.target.files);
                    selectedFiles = selectedFiles.concat(newFiles);

                    const dataTransfer = new DataTransfer();
                    selectedFiles.forEach(f => dataTransfer.items.add(f));
                    if (inputImagenes) inputImagenes.files = dataTransfer.files;

                    renderNewPreview();
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

                const añoValue = anioInput ? anioInput.value : '';
                const descValue = descInput ? descInput.value : '';

                if (!añoValue || !descValue) {
                    alert('El año y la descripción son obligatorios.');
                    if(submitButton) submitButton.disabled = false;
                    return;
                }

                const añoNum = parseInt(añoValue, 10);
                if (isNaN(añoNum) || añoNum <= 0) {
                     alert('El año debe ser un número positivo (mayor que 0).');
                     if(submitButton) submitButton.disabled = false;
                     return;
                }

                if (!mundial && selectedFiles.length === 0) {
                     alert('Debes subir al menos un archivo multimedia para crear un mundial.');
                     if(submitButton) submitButton.disabled = false;
                     return;
                }

                if (nombreInput) formData.append('nombre', nombreInput.value);
                formData.append('año', añoValue);
                formData.append('descripcion', descValue);

                const sedesIds = Array.from(selectedPaises.keys());
                sedesIds.forEach(id => formData.append('sedes', id));

                selectedFiles.forEach(file => {
                    formData.append('imagenes', file);
                });


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
        btnNuevoMundial.addEventListener('click', () => {
            if (todosLosPaises.length === 0) {
                alert('No se pueden crear mundiales porque no hay países registrados. Por favor, añada países primero.');
                return;
            }
            mostrarFormulario();
        });
     } else {
        console.error('Botón #btn-nuevo-mundial no encontrado.');
     }

    const style = document.createElement('style');
    style.innerHTML = `
        .image-preview-container { position: relative; } /* Necesario para posicionar controles */
        .mini-carousel-control {
            position: absolute;
            top: 50%;
            transform: translateY(-50%);
            background-color: rgba(0, 0, 0, 0.4);
            color: white;
            border: none;
            border-radius: 50%;
            width: 25px; /* Más pequeño */
            height: 25px;
            font-size: 14px;
            cursor: pointer;
            z-index: 10;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 0;
            line-height: 25px;
        }
        .mini-carousel-control.prev { left: 5px; }
        .mini-carousel-control.next { right: 5px; }
        .mini-carousel-control:disabled { opacity: 0.3; cursor: not-allowed; }
        .preview-container { display: flex; flex-wrap: wrap; gap: 5px; margin-top: 5px; max-height: 120px; overflow-y:auto; }
        .preview-item { position: relative; width: 50px; height: 50px; border: 1px solid #ccc; border-radius: 3px; overflow: hidden; background-color: #eee;}
        .preview-item img, .preview-item video { width: 100%; height: 100%; object-fit: cover; }
        .preview-item div { font-size: 10px; text-align: center; padding: 2px; color: #555; } /* Estilo para placeholder '...' */
        .preview-item .remove-btn {
            position: absolute; top: 0; right: 0; background-color: rgba(255, 0, 0, 0.7); color: white;
            border: none; border-radius: 0 0 0 3px; width: 15px; height: 15px; font-size: 10px;
            line-height: 15px; text-align: center; cursor: pointer; padding: 0;
        }
    `;
    document.head.appendChild(style);

    await cargarPaises();
    cargarMundiales();
});
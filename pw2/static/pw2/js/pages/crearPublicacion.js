document.addEventListener('DOMContentLoaded', async () => {
    window.auth.protectRoute();

    const form = document.getElementById('form-crear-publicacion');
    const categoriaSelect = document.getElementById('categoria');
    const mundialSelect = document.getElementById('mundial');
    const errorMessageDiv = document.getElementById('error-message');
    const multimediaInput = document.getElementById('multimedia');
    const previewContainer = document.getElementById('preview-container');
    let selectedFiles = [];

    async function cargarSelects() {
        try {
            const [categorias, mundiales] = await Promise.all([
                window.api.fetchAPI('/publicaciones/categorias/'),
                window.api.fetchAPI('/publicaciones/mundiales/')
            ]);


            if (categoriaSelect) {
                categorias.forEach(cat => {
                    const option = new Option(cat.nombre, cat.id);
                    categoriaSelect.add(option);
                });
            }


            if (mundialSelect) {
                 mundialSelect.add(new Option('Ninguno', ''));
                 mundiales.sort((a,b)=> b.año - a.año).forEach(mun => {
                    const option = new Option(mun.nombre ? `${mun.nombre} (${mun.año})` : `Mundial ${mun.año}`, mun.id);
                    mundialSelect.add(option);
                });
            }


        } catch (error) {
            mostrarError('No se pudieron cargar las categorias o mundiales.');

        }
    }

    function mostrarError(mensaje) {
        if(errorMessageDiv) {
             errorMessageDiv.textContent = mensaje;
             errorMessageDiv.style.display = 'block';
        }

    }

    function renderPreview() {
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
                    mediaElement.textContent = file.name.substring(0, 10) + '...';
                    mediaElement.style.fontSize = '10px';
                    mediaElement.style.textAlign = 'center';
                    mediaElement.style.padding = '5px';
                    mediaElement.style.wordBreak = 'break-all';
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
                    if (multimediaInput) multimediaInput.files = dataTransfer.files;
                    renderPreview();
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
    }

    if (multimediaInput) {
        multimediaInput.addEventListener('change', (e) => {
            if (e.target.files) {
                 const newFiles = Array.from(e.target.files);
                 selectedFiles = selectedFiles.concat(newFiles);

                 const dataTransfer = new DataTransfer();
                 selectedFiles.forEach(f => dataTransfer.items.add(f));
                 if (multimediaInput) multimediaInput.files = dataTransfer.files;
                 
                 renderPreview();
            }
        });
    }


    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            if(errorMessageDiv) errorMessageDiv.style.display = 'none';
            const submitButton = form.querySelector('button[type="submit"]');
            if(submitButton) submitButton.disabled = true;
            if(submitButton) submitButton.textContent = 'Publicando...';

            const datosPublicacion = {
                titulo: form.titulo.value,
                descripcion: form.descripcion.value,
                categoria: form.categoria.value ? parseInt(form.categoria.value, 10) : null,
                mundial: form.mundial.value ? parseInt(form.mundial.value, 10) : null,
            };

            if (!datosPublicacion.categoria) {
                 mostrarError('Debes seleccionar una categoría.');
                 if(submitButton) submitButton.disabled = false;
                 if(submitButton) submitButton.textContent = 'Publicar';
                 return;
            }

            if (selectedFiles.length === 0) {
                mostrarError('Debes subir al menos una imagen o video.');
                if(submitButton) submitButton.disabled = false;
                if(submitButton) submitButton.textContent = 'Publicar';
                return;
            }

            let nuevaPublicacion;
            try {
                nuevaPublicacion = await window.api.fetchAPI('/publicaciones/', {
                    method: 'POST',
                    body: JSON.stringify(datosPublicacion),
                });

            } catch (error) {
                mostrarError(`Hubo un error al crear la publicación: ${error.message}`);
                if(submitButton) submitButton.disabled = false;
                if(submitButton) submitButton.textContent = 'Publicar';
                return;
            }


            if (selectedFiles.length > 0) {
                if(submitButton) submitButton.textContent = 'Subiendo archivos...';

                const formData = new FormData();
                selectedFiles.forEach(file => {
                    formData.append('files', file);
                });

                if (formData.has('files')) {
                    try {

                        const mediaResponse = await window.api.fetchAPI(`/publicaciones/${nuevaPublicacion.id}/multimedia/`, {
                            method: 'POST',
                            body: formData
                        });


                        if (mediaResponse && Array.isArray(mediaResponse.errors) && mediaResponse.errors.length > 0) {
                             mostrarError(`Publicación creada (ID: ${nuevaPublicacion.id}), pero falló la subida de algunos archivos.`);
                             if(submitButton) submitButton.textContent = 'Error al subir';

                        } else {

                            window.location.href = `/publicaciones/${nuevaPublicacion.id}/`;
                        }
                    } catch (mediaError) {

                         mostrarError(`Publicación creada (ID: ${nuevaPublicacion.id}), pero falló la subida de archivos: ${mediaError.message}`);
                         if(submitButton) submitButton.textContent = 'Error al subir';

                    }
                } else {

                    window.location.href = `/publicaciones/${nuevaPublicacion.id}/`;
                }
            } else {

                window.location.href = `/publicaciones/${nuevaPublicacion.id}/`;
            }
        });
    }


    cargarSelects();
});
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
            console.error(error);
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
                    mediaElement.textContent = file.name.substring(0, 10) + '...'; // Acortar nombre
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
                    // Actualizar el valor del input file para reflejar la eliminación
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
                 // No leer Data URL para archivos no visualizables
                 reader.onload({ target: null }); // Llamar onload sin resultado para mostrar nombre
            }

            previewContainer.appendChild(previewItem);
        });
    }

    if (multimediaInput) {
        multimediaInput.addEventListener('change', (e) => {
            if (e.target.files) {
                 selectedFiles = Array.from(e.target.files);
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

            const datosPublicacion = {
                titulo: form.titulo.value,
                descripcion: form.descripcion.value,
                categoria: form.categoria.value ? parseInt(form.categoria.value, 10) : null,
                mundial: form.mundial.value ? parseInt(form.mundial.value, 10) : null,
            };

            if (!datosPublicacion.categoria) {
                 mostrarError('Debes seleccionar una categoría.');
                 if(submitButton) submitButton.disabled = false;
                 return;
            }


            try {
                const nuevaPublicacion = await window.api.fetchAPI('/publicaciones/', {
                    method: 'POST',
                    body: JSON.stringify(datosPublicacion),
                });

                // Verifica si hay archivos ANTES de intentar subirlos
                if (selectedFiles.length > 0) {
                    const formData = new FormData();
                    selectedFiles.forEach(file => {
                        formData.append('files', file); // Clave 'files'
                    });

                    // Verifica que formData tenga entradas
                    if (formData.has('files')) {
                        await window.api.fetchAPI(`/publicaciones/${nuevaPublicacion.id}/multimedia/`, {
                            method: 'POST',
                            body: formData
                            // No se especifica 'headers' para que el navegador ponga el correcto
                        });
                    } else {
                         console.warn("FormData estaba vacío antes de enviar multimedia.");
                    }

                } else {
                     console.log("No files selected to upload.");
                }

                window.location.href = `/publicaciones/${nuevaPublicacion.id}/`;

            } catch (error) {
                mostrarError(`Hubo un error al crear la publicacion: ${error.message}`);
                console.error('Detalle del error:', error);
                if(submitButton) submitButton.disabled = false; // Habilitar botón en caso de error
            }
            // No habilitar el botón aquí si tiene éxito, porque redirige
        });
    }


    cargarSelects();
});
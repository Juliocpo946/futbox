document.addEventListener('DOMContentLoaded', async () => {
    window.auth.protectRoute();

    const form = document.getElementById('form-crear-publicacion');
    const categoriaSelect = document.getElementById('categoria');
    const mundialSelect = document.getElementById('mundial');
    const errorMessageDiv = document.getElementById('error-message');

    async function cargarSelects() {
        try {
            const categorias = await window.api.fetchAPI('/publicaciones/categorias/');
            const mundiales = await window.api.fetchAPI('/publicaciones/mundiales/');

            categorias.forEach(cat => {
                const option = new Option(cat.nombre, cat.id);
                categoriaSelect.add(option);
            });

            mundialSelect.add(new Option('Ninguno', ''));
            mundiales.forEach(mun => {
                const option = new Option(`Mundial ${mun.año}`, mun.id);
                mundialSelect.add(option);
            });

        } catch (error) {
            mostrarError('No se pudieron cargar las categorias o mundiales.');
            console.error(error);
        }
    }

    function mostrarError(mensaje) {
        errorMessageDiv.textContent = mensaje;
        errorMessageDiv.style.display = 'block';
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        errorMessageDiv.style.display = 'none';
        const submitButton = form.querySelector('button[type="submit"]');
        submitButton.disabled = true;

        const datosPublicacion = {
            titulo: form.titulo.value,
            descripcion: form.descripcion.value,
            categoria: parseInt(form.categoria.value, 10),
            mundial: form.mundial.value ? parseInt(form.mundial.value, 10) : null,
        };

        try {
            const nuevaPublicacion = await window.api.fetchAPI('/publicaciones/', {
                method: 'POST',
                body: JSON.stringify(datosPublicacion),
            });

            const archivoInput = document.getElementById('multimedia');
            if (archivoInput.files.length > 0) {
                const formData = new FormData();
                formData.append('file', archivoInput.files[0]);

                await window.api.fetchAPI(`/publicaciones/${nuevaPublicacion.id}/multimedia/`, {
                    method: 'POST',
                    body: formData,
                });
            }

            window.location.href = `/publicaciones/${nuevaPublicacion.id}/`;

        } catch (error) {
            mostrarError('Hubo un error al crear la publicacion. Verifica los datos.');
            console.error(error);
        } finally {
            submitButton.disabled = false;
        }
    });

    cargarSelects();
});
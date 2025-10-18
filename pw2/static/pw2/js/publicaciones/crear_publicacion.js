document.addEventListener('DOMContentLoaded', async () => {
    if (!window.auth.isLoggedIn()) {
        window.location.href = '/login/';
        return;
    }

    const form = document.getElementById('form-crear-publicacion');
    const categoriaSelect = document.getElementById('categoria');
    const mundialSelect = document.getElementById('mundial');
    const errorMessageDiv = document.getElementById('error-message');

    async function cargarSelects() {
        try {
            // Cargar categorías (requiere endpoint de admin, pero se usa para el usuario)
            const categorias = await window.api.fetchAPI('/admin/categorias/');
            categorias.forEach(cat => {
                const option = new Option(cat.nombre, cat.id);
                categoriaSelect.add(option);
            });

            // Cargar mundiales
            const mundiales = await window.api.fetchAPI('/admin/mundiales/');
            mundialSelect.add(new Option('Ninguno', '')); // Opción por defecto
            mundiales.forEach(mun => {
                const option = new Option(mun.año, mun.id);
                mundialSelect.add(option);
            });

        } catch (error) {
            mostrarError('No se pudieron cargar las categorías o mundiales.');
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

        const datosPublicacion = {
            titulo: form.titulo.value,
            descripcion: form.descripcion.value,
            categoria: parseInt(form.categoria.value, 10),
            mundial: form.mundial.value ? parseInt(form.mundial.value, 10) : null,
        };

        try {
            // 1. Crear la publicación
            const nuevaPublicacion = await window.api.fetchAPI('/publicaciones/', {
                method: 'POST',
                body: JSON.stringify(datosPublicacion),
            });

            // 2. Subir la imagen si existe
            const archivoInput = document.getElementById('multimedia');
            if (archivoInput.files.length > 0) {
                const formData = new FormData();
                formData.append('file', archivoInput.files[0]);

                await window.api.fetchAPI(`/publicaciones/${nuevaPublicacion.id}/multimedia/`, {
                    method: 'POST',
                    body: formData,
                    // No se establece 'Content-Type', el navegador lo hace por nosotros con FormData
                    headers: {} 
                });
            }

            // 3. Redirigir a la página de la nueva publicación
            window.location.href = `/publicaciones/${nuevaPublicacion.id}/`;

        } catch (error) {
            mostrarError('Hubo un error al crear la publicación. Verifica los datos.');
            console.error(error);
        }
    });

    cargarSelects();
});
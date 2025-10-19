document.addEventListener('DOMContentLoaded', async () => {
    window.auth.protectRoute();

    const form = document.getElementById('form-editar-perfil');
    const errorMessageDiv = document.getElementById('error-message');
    const fotoPreview = document.getElementById('perfil-foto-preview');
    const btnCambiarFoto = document.getElementById('btn-cambiar-foto');
    const inputFoto = document.getElementById('input-foto');
    let archivoFoto = null;

    async function cargarDatos() {
        try {
            const user = await window.api.fetchAPI('/usuarios/perfil/');
            form.nombre.value = user.nombre || '';
            form.apellido_paterno.value = user.apellido_paterno || '';
            form.nickname.value = user.nickname || '';
            if (user.foto_perfil) {
                fotoPreview.src = user.foto_perfil;
            }
        } catch (error) {
            mostrarError('No se pudieron cargar tus datos.');
        }
    }

    function mostrarError(mensaje) {
        errorMessageDiv.textContent = mensaje;
        errorMessageDiv.style.display = 'block';
    }

    btnCambiarFoto.addEventListener('click', () => inputFoto.click());
    inputFoto.addEventListener('change', (e) => {
        if (e.target.files && e.target.files[0]) {
            archivoFoto = e.target.files[0];
            const reader = new FileReader();
            reader.onload = (event) => { fotoPreview.src = event.target.result; };
            reader.readAsDataURL(archivoFoto);
        }
    });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        errorMessageDiv.style.display = 'none';
        const submitButton = form.querySelector('button[type="submit"]');
        submitButton.disabled = true;

        const password = form.password.value.trim();
        const confirmPassword = form.confirm_password.value.trim();

        if (password && password !== confirmPassword) {
            mostrarError('Las contraseñas no coinciden.');
            submitButton.disabled = false;
            return;
        }

        try {
            if (archivoFoto) {
                const formData = new FormData();
                formData.append('file', archivoFoto);
                await window.api.fetchAPI('/usuarios/perfil/actualizar-foto/', {
                    method: 'POST',
                    body: formData,
                });
            }

            const datosFormulario = {
                nombre: form.nombre.value,
                apellido_paterno: form.apellido_paterno.value,
                nickname: form.nickname.value,
            };

            if (password) {
                datosFormulario.password = password;
            }

            await window.api.fetchAPI('/usuarios/perfil/actualizar/', {
                method: 'PUT',
                body: JSON.stringify(datosFormulario),
            });

            window.location.href = '/mi-perfil/';
        } catch (error) {
            mostrarError(error.message || 'Error al guardar los cambios.');
        } finally {
            submitButton.disabled = false;
        }
    });

    const modal = document.getElementById('confirmar-eliminacion-modal');
    const btnMostrarModal = document.getElementById('btn-mostrar-eliminar');
    const btnCancelarEliminar = document.getElementById('btn-cancelar-eliminar');
    const btnConfirmarEliminar = document.getElementById('btn-confirmar-eliminar');

    btnMostrarModal.addEventListener('click', () => {
        modal.classList.remove('modal-oculto');
        modal.classList.add('modal-visible');
    });

    btnCancelarEliminar.addEventListener('click', () => {
        modal.classList.add('modal-oculto');
        modal.classList.remove('modal-visible');
    });

    btnConfirmarEliminar.addEventListener('click', async () => {
        try {
            btnConfirmarEliminar.disabled = true;
            await window.api.fetchAPI('/usuarios/perfil/eliminar/', {
                method: 'DELETE',
            });
            window.auth.logout();
        } catch (error) {
            mostrarError('No se pudo eliminar la cuenta. Intentalo de nuevo.');
            console.error(error);
            btnConfirmarEliminar.disabled = false;
        }
    });

    cargarDatos();
});
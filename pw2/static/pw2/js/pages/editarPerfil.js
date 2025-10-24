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
            if(form.nombre) form.nombre.value = user.nombre || '';
            if(form.apellido_paterno) form.apellido_paterno.value = user.apellido_paterno || '';
            if(form.apellido_materno) form.apellido_materno.value = user.apellido_materno || '';
            if(form.nickname) form.nickname.value = user.nickname || '';
            if(form.fecha_nacimiento) form.fecha_nacimiento.value = user.fecha_nacimiento || '';
            if(form.genero) form.genero.value = user.genero || '';

            if (user.foto_perfil && fotoPreview) {
                fotoPreview.src = user.foto_perfil;
            }

            if(form.password) form.password.value = '';
            if(form.confirm_password) form.confirm_password.value = '';

        } catch (error) {
            mostrarError('No se pudieron cargar tus datos.');
        }
    }

    function mostrarError(mensaje) {
        if(errorMessageDiv) {
            errorMessageDiv.textContent = mensaje;
            errorMessageDiv.style.display = 'block';
        }
    }

   if(btnCambiarFoto && inputFoto) {
        btnCambiarFoto.addEventListener('click', () => inputFoto.click());
        inputFoto.addEventListener('change', (e) => {
            if (e.target.files && e.target.files[0]) {
                archivoFoto = e.target.files[0];
                const reader = new FileReader();
                reader.onload = (event) => {
                    if(fotoPreview && event.target) fotoPreview.src = event.target.result;
                 };
                reader.readAsDataURL(archivoFoto);
            }
        });
   }


   if(form){
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            if(errorMessageDiv) errorMessageDiv.style.display = 'none';
            const submitButton = form.querySelector('button[type="submit"]');
            if(submitButton) submitButton.disabled = true;

            const password = form.password ? form.password.value.trim() : '';
            const confirmPassword = form.confirm_password ? form.confirm_password.value.trim() : '';

            if (password && password !== confirmPassword) {
                mostrarError('Las contraseñas no coinciden.');
                 if(submitButton) submitButton.disabled = false;
                return;
            }

            try {
                if (archivoFoto) {
                    const formData = new FormData();
                    formData.append('file', archivoFoto);
                    await window.api.fetchAPI('/usuarios/perfil/actualizar-foto/', {
                        method: 'POST',
                        body: formData,
                        headers: {}
                    });
                     archivoFoto = null;
                     if(inputFoto) inputFoto.value = '';
                }

                const datosFormulario = {
                    nombre: form.nombre ? form.nombre.value : undefined,
                    apellido_paterno: form.apellido_paterno ? form.apellido_paterno.value : undefined,
                    apellido_materno: form.apellido_materno ? form.apellido_materno.value : undefined,
                    nickname: form.nickname ? form.nickname.value : undefined
                };

                if (form.fecha_nacimiento && form.fecha_nacimiento.value) {
                    datosFormulario.fecha_nacimiento = form.fecha_nacimiento.value;
                }

                if (form.genero && form.genero.value) {
                    datosFormulario.genero = form.genero.value;
                }

                if (password) {
                    datosFormulario.password = password;
                }

                 Object.keys(datosFormulario).forEach(key => datosFormulario[key] === undefined && delete datosFormulario[key]);


                await window.api.fetchAPI('/usuarios/perfil/actualizar/', {
                    method: 'PUT',
                    body: JSON.stringify(datosFormulario),
                });

                window.location.href = '/mi-perfil/';

            } catch (error) {
                mostrarError(error.message || 'Error al guardar los cambios.');
            } finally {
                 if(submitButton) submitButton.disabled = false;
            }
        });
   }


    const modal = document.getElementById('confirmar-eliminacion-modal');
    const btnMostrarModal = document.getElementById('btn-mostrar-eliminar');
    const btnCancelarEliminar = document.getElementById('btn-cancelar-eliminar');
    const btnConfirmarEliminar = document.getElementById('btn-confirmar-eliminar');

    if(modal && btnMostrarModal && btnCancelarEliminar && btnConfirmarEliminar) {
        btnMostrarModal.addEventListener('click', () => {
            modal.classList.remove('modal-oculto');
            modal.classList.add('modal-visible');
        });

        btnCancelarEliminar.addEventListener('click', () => {
            modal.classList.add('modal-oculto');
            modal.classList.remove('modal-visible');
        });

         modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                 modal.classList.add('modal-oculto');
                 modal.classList.remove('modal-visible');
            }
        });

        btnConfirmarEliminar.addEventListener('click', async () => {
            try {
                btnConfirmarEliminar.disabled = true;
                await window.api.fetchAPI('/usuarios/perfil/eliminar/', {
                    method: 'DELETE',
                });
                window.auth.logout();
            } catch (error) {
                mostrarError('No se pudo eliminar la cuenta. Inténtalo de nuevo.');
                console.error(error);
                btnConfirmarEliminar.disabled = false;
            }
        });
    }


    cargarDatos();
});
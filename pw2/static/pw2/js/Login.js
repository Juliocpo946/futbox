document.addEventListener('DOMContentLoaded', () => {
    // Selectores de elementos del DOM
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const registerLink = document.getElementById('register-link');
    const loginLink = document.getElementById('login-link');
    const errorMessageDiv = document.getElementById('error-message');

    // Función para mostrar errores
    function displayError(message) {
        errorMessageDiv.textContent = message;
    }

    // --- MANEJO DE FORMULARIOS ---

    // Evento para el formulario de Login
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        displayError(''); // Limpiar errores previos

        const formData = new FormData(loginForm);
        const data = Object.fromEntries(formData.entries());

        try {
            const result = await window.api.fetchAPI('/usuarios/login/', {
                method: 'POST',
                body: JSON.stringify(data),
            });
            
            // Guardar el token y los datos del usuario
            window.auth.saveAuthData(result.access, result.usuario);

            // Redirigir a la página principal
            window.location.href = '/';

        } catch (error) {
            displayError(error.message || 'Error al iniciar sesión. Verifica tus credenciales.');
        }
    });

    // Evento para el formulario de Registro
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        displayError('');

        const formData = new FormData(registerForm);
        const data = Object.fromEntries(formData.entries());

        try {
            await window.api.fetchAPI('/usuarios/registro/', {
                method: 'POST',
                body: JSON.stringify(data),
            });

            // Si el registro es exitoso, intenta hacer login automáticamente
            const loginData = {
                correo: data.correo,
                contraseña: data.contraseña
            };

            const result = await window.api.fetchAPI('/usuarios/login/', {
                method: 'POST',
                body: JSON.stringify(loginData),
            });

            window.auth.saveAuthData(result.access, result.usuario);
            window.location.href = '/';

        } catch (error) {
            displayError(error.message || 'Error en el registro. Verifica los datos ingresados.');
        }
    });

    // --- INTERCAMBIO DE FORMULARIOS VISUALMENTE ---

    registerLink.addEventListener('click', (e) => {
        e.preventDefault();
        loginForm.style.display = 'none';
        registerForm.style.display = 'block';
        registerLink.style.display = 'none';
        displayError('');
    });

    loginLink.addEventListener('click', (e) => {
        e.preventDefault();
        loginForm.style.display = 'block';
        registerForm.style.display = 'none';
        registerLink.style.display = 'block';
        displayError('');
    });
});
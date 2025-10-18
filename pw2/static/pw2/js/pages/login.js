document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const registerLink = document.getElementById('register-link');
    const loginLink = document.getElementById('login-link');
    const errorMessageDiv = document.getElementById('error-message');

    function displayError(message) {
        errorMessageDiv.textContent = message;
    }

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        displayError('');

        const formData = new FormData(loginForm);
        const data = Object.fromEntries(formData.entries());

        try {
            const result = await window.api.fetchAPI('/usuarios/login/', {
                method: 'POST',
                body: JSON.stringify(data),
            });
            
            window.auth.saveAuthData(result.access, result.usuario);
            window.location.href = '/';

        } catch (error) {
            displayError(error.message || 'Error al iniciar sesión. Verifica tus credenciales.');
        }
    });

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

            // CORRECCIÓN AQUÍ: Usar 'password' en lugar de 'contraseña'
            const loginData = {
                correo: data.correo,
                password: data.password 
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
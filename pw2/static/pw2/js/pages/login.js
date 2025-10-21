document.addEventListener('DOMContentLoaded', () => {
    window.auth.clearAuthData();
    
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const registerLink = document.getElementById('register-link');
    const loginLink = document.getElementById('login-link');
    const errorMessageDiv = document.getElementById('error-message');

    function displayError(message) {
        errorMessageDiv.textContent = message;
        errorMessageDiv.style.display = 'block';
    }
    
    function clearError() {
        errorMessageDiv.textContent = '';
        errorMessageDiv.style.display = 'none';
    }

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        clearError();

        const data = {
            correo: loginForm.email.value,
            password: loginForm.password.value,
        };

        try {
            const result = await window.api.fetchAPI('/usuarios/login/', {
                method: 'POST',
                body: JSON.stringify(data),
            });
            
            window.auth.saveAuthData(result.access, result.usuario);
            window.location.replace('/');

        } catch (error) {
            displayError('Error al iniciar sesión: ' + error.message);
        }
    });

    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        clearError();

        const formData = new FormData(registerForm);
        const data = Object.fromEntries(formData.entries());
        
        Object.keys(data).forEach(key => {
            if (data[key] === '' || data[key] === null) {
                delete data[key];
            }
        });
        
        delete data.csrfmiddlewaretoken;

        try {
            await window.api.fetchAPI('/usuarios/registro/', {
                method: 'POST',
                body: JSON.stringify(data),
            });

            const loginData = {
                correo: data.correo,
                password: data.password
            };

            const result = await window.api.fetchAPI('/usuarios/login/', {
                method: 'POST',
                body: JSON.stringify(loginData),
            });

            window.auth.saveAuthData(result.access, result.usuario);
            window.location.replace('/');

        } catch (error) {
            displayError('Error en el registro: ' + error.message);
        }
    });

    registerLink.addEventListener('click', (e) => {
        e.preventDefault();
        loginForm.style.display = 'none';
        registerForm.style.display = 'block';
        registerLink.style.display = 'none';
        clearError();
    });

    loginLink.addEventListener('click', (e) => {
        e.preventDefault();
        loginForm.style.display = 'block';
        registerForm.style.display = 'none';
        registerLink.style.display = 'block';
        clearError();
    });
});
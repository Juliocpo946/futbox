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

    if (loginForm) {
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
    }

    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            clearError();

            const formData = new FormData(registerForm);
            const data = Object.fromEntries(formData.entries());

            const password = data.password;
            const fechaNacimiento = data.fecha_nacimiento;

            if (password.length < 8) {
                displayError('La contraseña debe tener al menos 8 caracteres.');
                return;
            }

            if (fechaNacimiento) {
                const hoy = new Date();
                const fechaNac = new Date(fechaNacimiento);
                let edad = hoy.getFullYear() - fechaNac.getFullYear();
                const mes = hoy.getMonth() - fechaNac.getMonth();
                if (mes < 0 || (mes === 0 && hoy.getDate() < fechaNac.getDate())) {
                    edad--;
                }
                if (edad < 12) {
                    displayError('Debes tener al menos 12 años para registrarte.');
                    return;
                }
            }


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
    }

    if (registerLink) {
        registerLink.addEventListener('click', (e) => {
            e.preventDefault();
            if (loginForm) loginForm.style.display = 'none';
            if (registerForm) registerForm.style.display = 'block';
            registerLink.style.display = 'none';
            if (loginLink) loginLink.style.display = 'block';
            clearError();
        });
    }

    if (loginLink) {
        loginLink.addEventListener('click', (e) => {
            e.preventDefault();
            if (loginForm) loginForm.style.display = 'block';
            if (registerForm) registerForm.style.display = 'none';
            if (registerLink) registerLink.style.display = 'block';
            loginLink.style.display = 'none';
            clearError();
        });
        loginLink.style.display = 'none'; 
    }
});
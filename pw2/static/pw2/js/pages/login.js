document.addEventListener('DOMContentLoaded', () => {
    window.auth.clearAuthData();

    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const registerLink = document.getElementById('register-link');
    const loginLink = document.getElementById('login-link');
    const errorMessageDiv = document.getElementById('error-message');

    function formatErrorMessage(error) {
        if (!error) return 'Error desconocido.';

        const errorMessage = error.message || error;
        const lowerMessage = errorMessage.toLowerCase();

        if (lowerMessage.includes('credenciales invalidas') || lowerMessage.includes('credentials')) {
            return 'Correo electrónico o contraseña incorrectos.';
        }
        if (lowerMessage.includes('correo electronico ya esta en uso') || lowerMessage.includes('already exists') || lowerMessage.includes('unique')) {
            return 'El correo electrónico ya está registrado en el sistema.';
        }
        if (lowerMessage.includes('nickname ya esta en uso') || lowerMessage.includes('nickname')) {
            return 'El nickname que ingresaste ya está en uso.';
        }
        if (lowerMessage.includes('cuenta ha sido desactivada') || lowerMessage.includes('disabled')) {
            return 'Esta cuenta ha sido desactivada.';
        }
        if (lowerMessage.includes('usuario no existe') || lowerMessage.includes('not found')) {
            return 'Usuario no encontrado.';
        }
        if (lowerMessage.includes('sesión expirada') || lowerMessage.includes('unauthorized')) {
            return 'Tu sesión ha expirado. Por favor inicia sesión nuevamente.';
        }
        if (lowerMessage.includes('error en el servidor') || lowerMessage.includes('500')) {
            return 'Error en el servidor. Por favor intenta más tarde.';
        }
        if (lowerMessage.includes('conectar') || lowerMessage.includes('network') || lowerMessage.includes('fetch')) {
            return 'Error de conexión. Verifica tu conexión a internet.';
        }

        return errorMessage;
    }

    function displayError(message) {
        const formattedMessage = formatErrorMessage(message);
        errorMessageDiv.textContent = formattedMessage;
        errorMessageDiv.style.display = 'block';
        errorMessageDiv.style.color = '#721c24';
    }

    function clearError() {
        errorMessageDiv.textContent = '';
        errorMessageDiv.style.display = 'none';
    }

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            clearError();

            const emailInput = loginForm.email;
            const passwordInput = loginForm.password;

            if (!emailInput || !passwordInput) {
                displayError('Formulario incompleto. Por favor verifica los campos.');
                return;
            }

            const email = emailInput.value.trim();
            const password = passwordInput.value;

            if (!email || !password) {
                displayError('Por favor completa todos los campos (Correo y Contraseña).');
                return;
            }

            if (!email.includes('@')) {
                displayError('Por favor ingresa un correo electrónico válido.');
                return;
            }

            const data = {
                correo: email,
                password: password,
            };

            const submitBtn = loginForm.querySelector('button[type="submit"]');
            try {
                if (submitBtn) {
                    submitBtn.disabled = true;
                    submitBtn.textContent = 'Iniciando sesión...';
                }

                const result = await window.api.fetchAPI('/usuarios/login/', {
                    method: 'POST',
                    body: JSON.stringify(data),
                });

                if (result && result.access && result.usuario) {
                    window.auth.saveAuthData(result.access, result.usuario);
                    window.location.replace('/');
                } else {
                    displayError('Respuesta inválida del servidor.');
                    if (submitBtn) {
                        submitBtn.disabled = false;
                        submitBtn.textContent = 'Entrar';
                    }
                }

            } catch (error) {
                displayError(error.message);
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.textContent = 'Entrar';
                }
            }
        });
    }

    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            clearError();

            const formData = new FormData(registerForm);
            const data = Object.fromEntries(formData.entries());

            const nombre = data.nombre ? data.nombre.trim() : '';
            const correo = data.correo ? data.correo.trim() : '';
            const nickname = data.nickname ? data.nickname.trim() : '';
            const password = data.password || '';

            if (!nombre || !correo || !nickname || !password) {
                displayError('Por favor completa los campos obligatorios: Nombre, Correo, Nickname y Contraseña.');
                return;
            }


            if (password.length < 8) {
                displayError('La contraseña debe tener al menos 8 caracteres.');
                return;
            }

            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(correo)) {
                displayError('Por favor ingresa un correo electrónico válido (ej: usuario@ejemplo.com).');
                return;
            }

            if (nickname.length < 3) {
                displayError('El nickname debe tener al menos 3 caracteres.');
                return;
            }

            if (nickname.length > 255) {
                displayError('El nickname no puede exceder 255 caracteres.');
                return;
            }

            const fechaNacimiento = data.fecha_nacimiento;
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

            const submitBtn = registerForm.querySelector('button[type="submit"]');
            try {
                if (submitBtn) {
                    submitBtn.disabled = true;
                    submitBtn.textContent = 'Registrando...';
                }

                const registroResponse = await window.api.fetchAPI('/usuarios/registro/', {
                    method: 'POST',
                    body: JSON.stringify(data),
                });

                if (!registroResponse) {
                    throw new Error('Error en el registro.');
                }

                const loginData = {
                    correo: correo,
                    password: password
                };

                const result = await window.api.fetchAPI('/usuarios/login/', {
                    method: 'POST',
                    body: JSON.stringify(loginData),
                });

                if (result && result.access && result.usuario) {
                    window.auth.saveAuthData(result.access, result.usuario);
                    window.location.replace('/');
                } else {
                    displayError('Se registró correctamente, pero hubo un error al iniciar sesión. Por favor intenta nuevamente.');
                    if (submitBtn) {
                        submitBtn.disabled = false;
                        submitBtn.textContent = 'Registrarme';
                    }
                }

            } catch (error) {
                const errorMsg = error.message || 'Error en el registro.';
                displayError(errorMsg);
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.textContent = 'Registrarme';
                }
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
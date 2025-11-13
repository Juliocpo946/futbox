const BASE_URL = 'http://127.0.0.1:8000/api';

async function fetchAPI(endpoint, options = {}) {
    const url = `${BASE_URL}${endpoint}`;

    const defaultHeaders = {};

    if (!(options.body instanceof FormData)) {
        defaultHeaders['Content-Type'] = 'application/json';
    }

    const headers = {
        ...defaultHeaders,
        ...options.headers,
    };

    const token = window.auth.getAuthToken();
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const config = {
        ...options,
        headers,
    };

    try {
        const response = await fetch(url, config);

        const isLoginEndpoint = endpoint.includes('/usuarios/login/');

        if (response.status === 401) {
            if (isLoginEndpoint) {
                let errorData;
                try {
                    errorData = await response.json();
                } catch (e) {
                    errorData = { error: 'Correo o contraseña incorrectos.' };
                }
                let errorMessage = errorData?.error || 'Correo o contraseña incorrectos.';
                throw new Error(errorMessage);
            } else {
                window.auth.clearAuthData();
                if (window.location.pathname !== '/login/') {
                    window.location.replace('/login/');
                }
                throw new Error('Sesión expirada');
            }
        }

        if (response.status === 403) {
            let errorData;
            try {
                errorData = await response.json();
            } catch (e) {
                errorData = { error: 'No tienes permisos para esta acción.' };
            }
            let errorMessage = errorData?.error || 'No tienes permisos para esta acción.';
            throw new Error(errorMessage);
        }

        if (response.status === 404) {
            throw new Error('Recurso no encontrado');
        }

        if (!response.ok) {
            let errorData;
            try {
                errorData = await response.json();
            } catch (e) {
                errorData = { error: `Error HTTP ${response.status}: ${response.statusText}` };
            }

            let errorMessage = errorData?.error || errorData?.detail || JSON.stringify(errorData);
            throw new Error(errorMessage);
        }

        if (response.status === 204) {
            return null;
        }

        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
            return await response.json();
        } else {
            return await response.text();
        }

    } catch (error) {
        console.error('Error en la petición a la API:', error);
        throw error;
    }
}

window.api = { fetchAPI };
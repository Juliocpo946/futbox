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

        if (response.status === 401 || response.status === 403) {
            window.auth.clearAuthData();
            if (window.location.pathname !== '/login/') {
                window.location.replace('/login/');
            }
            throw new Error('Sesión expirada o sin permisos');
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

            let errorMessage = 'Ocurrió un error inesperado.';

            if (errorData) {
                if (typeof errorData === 'string') {
                    errorMessage = errorData;
                }
                else if (errorData.error) {
                    if (Array.isArray(errorData.error)) {
                        errorMessage = errorData.error[0] || errorData.error;
                    } else {
                        errorMessage = errorData.error;
                    }
                }
                else if (errorData.detail) {
                    errorMessage = errorData.detail;
                }
                else if (Object.keys(errorData).length > 0) {
                    const firstKey = Object.keys(errorData)[0];
                    const fieldError = errorData[firstKey];
                    if (Array.isArray(fieldError)) {
                        errorMessage = fieldError[0];
                    } else {
                        errorMessage = fieldError;
                    }
                } else {
                    errorMessage = JSON.stringify(errorData);
                }
            }

            throw new Error(errorMessage);
        }

        if (response.status === 204) {
            return null;
        }

        const contentType = response.headers.get("content-type");
        if (contentType && contentType.indexOf("application/json") !== -1) {
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
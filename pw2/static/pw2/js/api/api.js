const BASE_URL = 'http://127.0.0.1:8000/api';

async function fetchAPI(endpoint, options = {}) {
    const url = `${BASE_URL}${endpoint}`;
    
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
    };

    const token = window.auth.getAuthToken();
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    if (options.body instanceof FormData) {
        delete headers['Content-Type'];
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
            throw new Error('Sesión expirada');
        }

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            let errorMessage = 'Ocurrió un error inesperado.';
            if (Object.keys(errorData).length > 0) {
                errorMessage = errorData.error || errorData.detail || JSON.stringify(errorData);
            } else {
                errorMessage = `Error HTTP: ${response.status}`;
            }
            throw new Error(errorMessage);
        }

        if (response.status === 204) {
            return null;
        }

        return await response.json();
    } catch (error) {
        console.error('Error en la petición a la API:', error);
        throw error;
    }
}

window.api = { fetchAPI };
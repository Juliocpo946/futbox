const BASE_URL = 'http://127.0.0.1:8000/api';

async function fetchAPI(endpoint, options = {}) {
    const url = `${BASE_URL}${endpoint}`;
    
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
    };

    const token = sessionStorage.getItem('accessToken');
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const config = {
        ...options,
        headers,
    };

    try {
        const response = await fetch(url, config);

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error('Error del servidor:', errorData);
            
            let errorMessage = '';
            if (errorData.error) {
                errorMessage = errorData.error;
            } else if (errorData.correo) {
                errorMessage = 'El correo electrónico ya está en uso.';
            } else if (errorData.nickname) {
                errorMessage = 'El nickname ya está en uso.';
            } else {
                errorMessage = JSON.stringify(errorData) || `Error HTTP: ${response.status}`;
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
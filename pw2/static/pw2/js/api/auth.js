function saveAuthData(token, userData) {
    localStorage.setItem('accessToken', token);
    localStorage.setItem('userData', JSON.stringify(userData));
}

function getAuthToken() {
    return localStorage.getItem('accessToken');
}

function getUserData() {
    const userData = localStorage.getItem('userData');
    return userData ? JSON.parse(userData) : null;
}

function isAdmin() {
    const userData = getUserData();
    return userData && userData.rol === 'admin';
}

function isLoggedIn() {
    return !!getAuthToken();
}

async function logout() {
    const token = getAuthToken();
    
    if (token) {
        try {
            await fetch('/api/usuarios/logout/', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
        } catch (error) {
            console.error("Error al cerrar sesión en el servidor:", error);
        }
    }

    localStorage.removeItem('accessToken');
    localStorage.removeItem('userData');
    window.location.href = '/login/';
}

function protectRoute() {
    if (!isLoggedIn()) {
        window.location.href = '/login/';
    }
}

window.auth = {
    saveAuthData,
    getAuthToken,
    getUserData,
    isAdmin,
    isLoggedIn,
    logout,
    protectRoute,
};
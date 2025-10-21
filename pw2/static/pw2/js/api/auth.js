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
    const token = getAuthToken();
    const userData = getUserData();
    return !!(token && userData);
}

function clearAuthData() {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('userData');
}

async function logout() {
    clearAuthData();
    
    try {
        await fetch('/api/usuarios/logout/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });
    } catch (error) {
        console.error("Error al cerrar sesión en el servidor:", error);
    }
    
    window.location.replace('/login/');
}

function protectRoute() {
    if (!isLoggedIn()) {
        clearAuthData();
        window.location.replace('/login/');
    }
}

window.auth = {
    saveAuthData,
    getAuthToken,
    getUserData,
    isAdmin,
    isLoggedIn,
    logout,
    clearAuthData,
    protectRoute,
};
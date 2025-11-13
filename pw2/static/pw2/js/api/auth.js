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

function clearAuthData() {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('userData');
}

function isLoggedIn() {
    const token = getAuthToken();
    const userData = getUserData();
    return !!(token && userData);
}

function protectRoute() {
    if (!isLoggedIn()) {
        clearAuthData();
        window.location.replace('/login.html');
    }
}

function isAdmin() {
    const userData = getUserData();
    return userData && userData.rol === 'admin';
}

async function logout() {
    clearAuthData();
    try {
        await window.api.fetchAPI('/usuarios/logout/', { method: 'POST' });
    } catch (error) {
        console.error("Error al cerrar sesión en servidor:", error);
    }
    window.location.replace('/login.html');
}

window.auth = {
    saveAuthData,
    getAuthToken,
    getUserData,
    clearAuthData,
    isLoggedIn,
    protectRoute,
    isAdmin,
    logout
};
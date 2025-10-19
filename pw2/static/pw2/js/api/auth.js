function saveAuthData(token, userData) {
    sessionStorage.setItem('accessToken', token);
    sessionStorage.setItem('userData', JSON.stringify(userData));
}

function getAuthToken() {
    return sessionStorage.getItem('accessToken');
}

function getUserData() {
    const userData = sessionStorage.getItem('userData');
    return userData ? JSON.parse(userData) : null;
}

function isAdmin() {
    const userData = getUserData();
    return userData && userData.rol === 'admin';
}

function isLoggedIn() {
    return !!getAuthToken();
}

function logout() {
    sessionStorage.removeItem('accessToken');
    sessionStorage.removeItem('userData');
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
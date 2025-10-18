document.addEventListener('DOMContentLoaded', () => {
    const navUnauthenticated = document.getElementById('nav-unauthenticated');
    const profileSectionAuthenticated = document.getElementById('profile-section-authenticated');
    const logoutButton = document.getElementById('logout-button');

    function updateUIForAuthState() {
        if (window.auth.isLoggedIn()) {
            // Usuario autenticado
            navUnauthenticated.style.display = 'none';
            profileSectionAuthenticated.style.display = 'block';
            
            const userData = window.auth.getUserData();
            if (userData) {
                document.getElementById('profile-name').textContent = userData.nombre;
                document.getElementById('profile-nickname').textContent = `@${userData.nickname}`;
                // Aquí podrías actualizar también la foto de perfil si la URL estuviera en userData
            }
        } else {
            // Usuario no autenticado
            navUnauthenticated.style.display = 'flex';
            profileSectionAuthenticated.style.display = 'none';
        }
    }

    if (logoutButton) {
        logoutButton.addEventListener('click', (e) => {
            e.preventDefault();
            window.auth.logout();
        });
    }

    // Llama a la función al cargar la página
    updateUIForAuthState();
});
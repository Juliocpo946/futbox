document.addEventListener('DOMContentLoaded', () => {
    const adminNavContainer = document.getElementById('admin-nav-link-container');

    async function setupAdminNav() {
        if (window.auth.isAdmin() && adminNavContainer) {
            try {
                const stats = await window.api.fetchAPI('/admin/stats/');
                const pendingCount = stats.publicaciones_pendientes;

                let badgeHtml = '';
                if (pendingCount > 0) {
                    badgeHtml = `<span class="notification-badge">${pendingCount}</span>`;
                }
                
                adminNavContainer.innerHTML = `
                    <a href="/admin/" class="admin-nav-link">
                        Admin Panel ${badgeHtml}
                    </a>
                `;
            } catch (error) {
                adminNavContainer.innerHTML = '<a href="/admin/" class="admin-nav-link">Admin Panel</a>';
                console.error("Error al cargar estadísticas para nav:", error);
            }
        }
    }
    
    if (window.auth.isLoggedIn()) {
        setupAdminNav();
    }
});
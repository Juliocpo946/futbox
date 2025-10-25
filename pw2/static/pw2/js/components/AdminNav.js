async function setupAdminNav() {
    const adminNavContainer = document.getElementById('admin-nav-link-container');
    if (!adminNavContainer || !window.auth.isAdmin()) return;

    try {
        const stats = await window.api.fetchAPI('/admin/stats/');
        const pendingCount = stats.publicaciones_pendientes;
        const badgeHtml = pendingCount > 0 
            ? `<span class="notification-badge">${pendingCount}</span>` 
            : '';
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

document.addEventListener('DOMContentLoaded', () => {
    if (window.auth.isLoggedIn()) {
        setupAdminNav();
    }
});
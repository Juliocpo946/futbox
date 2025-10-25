async function inicializarBarraNavegacion(config = {}) {
    const mostrarAdminLink = config.mostrarAdminLink !== false;

    if (mostrarAdminLink && window.auth.isAdmin()) {
        const adminNavContainer = document.getElementById('admin-nav-link-container');
        if (adminNavContainer) {
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

            }
        }
    }
}

window.inicializarBarraNavegacion = inicializarBarraNavegacion;

document.addEventListener('DOMContentLoaded', () => {
    if (window.location.pathname !== '/login/' && !window.location.pathname.startsWith('/admin/')) {
        const filtros = new window.FiltrosPublicaciones({
            tituloSeccionId: null,
            onFilterChange: (endpoint) => {
                const params = new URLSearchParams(endpoint.split('?')[1]);
                if (window.location.pathname.startsWith('/publicaciones')) {
                    window.location.search = params.toString();
                } else {
                     window.location.href = `/publicaciones/?${params.toString()}`;
                }
            }
        });
    }
});
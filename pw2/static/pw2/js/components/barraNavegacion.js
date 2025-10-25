async function inicializarBarraNavegacion(config = {}) {
    const mostrarBuscador = config.mostrarBuscador !== false;
    const mostrarAdminLink = config.mostrarAdminLink !== false;

    if (mostrarBuscador) {
        const mundialSelect = document.getElementById('mundial-filter-nav');
        if (mundialSelect) {
            try {
                const mundiales = await window.api.fetchAPI('/publicaciones/mundiales/');
                mundiales.sort((a, b) => b.año - a.año);
                mundiales.forEach(mundial => {
                    const option = document.createElement('option');
                    option.value = mundial.id;
                    option.textContent = mundial.nombre ? `${mundial.nombre} (${mundial.año})` : `Mundial ${mundial.año}`;
                    mundialSelect.appendChild(option);
                });
            } catch (error) {
                console.error("Error al cargar mundiales:", error);
            }
        }
    }

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
                console.error("Error al cargar estadísticas para nav:", error);
            }
        }
    }
}

window.inicializarBarraNavegacion = inicializarBarraNavegacion;
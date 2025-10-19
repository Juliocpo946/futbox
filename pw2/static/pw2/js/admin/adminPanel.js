document.addEventListener('DOMContentLoaded', async () => {
    window.auth.protectRoute();
    const userData = window.auth.getUserData();
    if (!userData || userData.rol !== 'admin') {
        window.location.href = '/';
        return;
    }

    const statsContainer = document.getElementById('dashboard-stats');

    async function cargarEstadisticas() {
        try {
            // Hacemos las llamadas en paralelo para más eficiencia
            const [pendientes, usuarios] = await Promise.all([
                window.api.fetchAPI('/admin/publicaciones/pendientes/'),
                window.api.fetchAPI('/admin/usuarios/')
            ]);
            
            statsContainer.innerHTML = `
                <div class="reporte-card">
                    <h2>Estadísticas Rápidas</h2>
                    <ul>
                        <li><strong>${pendientes.length}</strong> publicaciones pendientes de revisión.</li>
                        <li><strong>${usuarios.length}</strong> usuarios registrados en total.</li>
                    </ul>
                </div>
            `;
        } catch (error) {
            statsContainer.innerHTML = '<p>No se pudieron cargar las estadísticas.</p>';
        }
    }

    cargarEstadisticas();
});
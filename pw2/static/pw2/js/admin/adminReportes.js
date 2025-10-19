document.addEventListener('DOMContentLoaded', async () => {
    window.auth.protectRoute();
    const userData = window.auth.getUserData();
    if (!userData || userData.rol !== 'admin') {
        window.location.href = '/';
        return;
    }

    const container = document.getElementById('reportes-container');

    async function cargarReportes() {
        try {
            const reportes = await window.api.fetchAPI('/reportes/');
            renderReportes(reportes);
        } catch (error) {
            container.innerHTML = `<p>Error al cargar los reportes: ${error.message}</p>`;
        }
    }

    function renderReportes(reportes) {
        container.innerHTML = ''; // Limpiar el contenedor

        // Reporte 1: Publicaciones más comentadas
        let pubHtml = '<h2><i class="fas fa-comments"></i> Publicaciones más Comentadas</h2><ul>';
        reportes.publicaciones_mas_comentadas.forEach(item => {
            pubHtml += `<li>${item.titulo} - <strong>${item.num_comentarios} comentarios</strong></li>`;
        });
        pubHtml += '</ul>';
        container.innerHTML += `<div class="reporte-card">${pubHtml}</div>`;

        // Reporte 2: Usuarios más activos
        let userHtml = '<h2><i class="fas fa-user-edit"></i> Usuarios más Activos</h2><ul>';
        reportes.usuarios_mas_activos.forEach(item => {
            userHtml += `<li>@${item.nickname} - <strong>${item.actividad_total} contribuciones</strong></li>`;
        });
        userHtml += '</ul>';
        container.innerHTML += `<div class="reporte-card">${userHtml}</div>`;

        // Reporte 3: Categorías con más contenido
        let catHtml = '<h2><i class="fas fa-tags"></i> Categorías Populares</h2><ul>';
        reportes.categorias_con_mas_contenido.forEach(item => {
            catHtml += `<li>${item.nombre} - <strong>${item.num_publicaciones} publicaciones</strong></li>`;
        });
        catHtml += '</ul>';
        container.innerHTML += `<div class="reporte-card">${catHtml}</div>`;

        // Reporte 4: Mundiales con más interacción
        let munHtml = '<h2><i class="fas fa-trophy"></i> Mundiales con más Interacción</h2><ul>';
        reportes.mundiales_con_mas_interaccion.forEach(item => {
            munHtml += `<li>Mundial ${item.año} - <strong>${item.interaccion_total} interacciones</strong></li>`;
        });
        munHtml += '</ul>';
        container.innerHTML += `<div class="reporte-card">${munHtml}</div>`;
    }

    cargarReportes();
});
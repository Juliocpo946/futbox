document.addEventListener('DOMContentLoaded', async () => {
    if (!window.auth.isLoggedIn()) {
        window.location.href = '/login/';
        return;
    }

    const logoutButton = document.getElementById('logout-button');
    if(logoutButton) {
        logoutButton.addEventListener('click', () => window.auth.logout());
    }

    async function cargarDatosPerfil() {
        try {
            const userData = await window.api.fetchAPI('/usuarios/perfil/');
            document.getElementById('perfil-nombre').textContent = `${userData.nombre} ${userData.apellido_paterno || ''}`;
            document.getElementById('perfil-nickname').textContent = `@${userData.nickname}`;
            document.getElementById('perfil-correo').textContent = userData.correo;
        } catch (error) {
            console.error("Error al cargar datos del perfil:", error);
        }
    }

    async function cargarMisPublicaciones() {
        const container = document.getElementById('mis-publicaciones-container');
        try {
            const publicaciones = await window.api.fetchAPI('/usuarios/mis-publicaciones/');
            if (publicaciones.length === 0) {
                container.innerHTML = "<p>Aún no has creado ninguna publicación.</p>";
                return;
            }

            container.innerHTML = '';
            publicaciones.forEach(pub => {
                const card = document.createElement('div');
                card.className = 'publicacion-card';
                // Solo las publicaciones aprobadas son clickeables para ver el detalle
                if(pub.estatus === 'aprobada') {
                    card.style.cursor = 'pointer';
                    card.onclick = () => { window.location.href = `/publicaciones/${pub.id}/`; };
                }
                
                const estatusClass = `estatus-${pub.estatus}`;

                card.innerHTML = `
                    <div class="publicacion-body">
                        <h3>${pub.titulo}</h3>
                        <p>${pub.descripcion.substring(0, 100)}...</p>
                        <span class="estatus-publicacion ${estatusClass}">${pub.estatus.charAt(0).toUpperCase() + pub.estatus.slice(1)}</span>
                    </div>
                `;
                container.appendChild(card);
            });

        } catch (error) {
            container.innerHTML = "<p>Error al cargar tus publicaciones.</p>";
            console.error(error);
        }
    }

    cargarDatosPerfil();
    cargarMisPublicaciones();
});
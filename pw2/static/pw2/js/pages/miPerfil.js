document.addEventListener('DOMContentLoaded', async () => {
    window.auth.protectRoute();

    async function cargarDatosPerfil() {
        const container = document.getElementById('perfil-header-container');
        try {
            const userData = await window.api.fetchAPI('/usuarios/perfil/');
            container.innerHTML = `
                <div class="perfil-header">
                    <img id="perfil-foto" src="${userData.foto_perfil || '/static/pw2/images/Haerin.jpg'}" alt="Foto de Perfil" class="perfil-foto-grande">
                    <div class="perfil-info">
                        <h1 id="perfil-nombre">${userData.nombre} ${userData.apellido_paterno || ''}</h1>
                        <p id="perfil-nickname" class="nickname-perfil">@${userData.nickname}</p>
                        <p id="perfil-correo" class="correo-perfil">${userData.correo}</p>
                        <div class="perfil-acciones">
                            <a href="{% url 'pw2:editar_perfil' %}" class="btn-editar-perfil" style="text-decoration: none;">Editar Perfil</a>
                            <button id="logout-button" class="btn-cerrar-sesion">Cerrar Sesión</button>
                        </div>
                    </div>
                </div>
            `;
            document.getElementById('logout-button').addEventListener('click', () => window.auth.logout());
        } catch (error) {
            container.innerHTML = "<p>Error al cargar los datos del perfil.</p>";
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
                if (pub.estatus === 'aprobada') {
                    card.style.cursor = 'pointer';
                    card.onclick = () => { window.location.href = `/publicaciones/${pub.id}/`; };
                }
                
                const estatusClass = `estatus-${pub.estatus}`;
                const estatusTexto = pub.estatus.charAt(0).toUpperCase() + pub.estatus.slice(1);

                card.innerHTML = `
                    <div class="publicacion-body">
                        <h3>${pub.titulo}</h3>
                        <p>${pub.descripcion.substring(0, 100)}...</p>
                        <span class="estatus-publicacion ${estatusClass}">${estatusTexto}</span>
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
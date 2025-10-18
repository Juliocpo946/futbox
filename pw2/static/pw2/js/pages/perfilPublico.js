document.addEventListener('DOMContentLoaded', async () => {
    if (!window.auth.isLoggedIn()) {
        window.location.href = '/login/';
        return;
    }
    const container = document.getElementById('perfil-publico-container');

    async function cargarPerfilPublico() {
        try {
            const perfil = await window.api.fetchAPI(`/perfil/${NICKNAME_PERFIL}/`);
            const publicaciones = await window.api.fetchAPI(`/perfil/publicaciones/${perfil.id}/`);
            
            renderPerfil(perfil);
            renderPublicaciones(publicaciones);
            
        } catch (error) {
            container.innerHTML = `<h1>Usuario no encontrado</h1><p>El perfil de @${NICKNAME_PERFIL} no existe o no está disponible.</p>`;
        }
    }

    function renderPerfil(perfil) {
        const fechaRegistro = new Date(perfil.fecha_registro).toLocaleDateString('es-ES', { year: 'numeric', month: 'long' });
        const foto = perfil.foto_perfil || '/static/pw2/images/Haerin.jpg';
        
        container.innerHTML = `
            <div class="perfil-header">
                <img src="${foto}" alt="Foto de ${perfil.nombre}" class="perfil-foto-grande">
                <div class="perfil-info">
                    <h1>${perfil.nombre}</h1>
                    <p class="nickname-perfil">@${perfil.nickname}</p>
                    <p class="correo-perfil">Usuario desde ${fechaRegistro}</p>
                </div>
            </div>
            <div class="perfil-contenido">
                <h2>Publicaciones de @${perfil.nickname}</h2>
                <div id="publicaciones-container" class="publicaciones-grid"></div>
            </div>
        `;
    }

    function renderPublicaciones(publicaciones) {
        const pubContainer = document.getElementById('publicaciones-container');
        if (publicaciones.length === 0) {
            pubContainer.innerHTML = "<p>Este usuario aún no tiene publicaciones aprobadas.</p>";
            return;
        }
        pubContainer.innerHTML = '';
        publicaciones.forEach(pub => {
            const card = document.createElement('div');
            card.className = 'publicacion-card';
            card.style.cursor = 'pointer';
            card.onclick = () => { window.location.href = `/publicaciones/${pub.id}/`; };
            card.innerHTML = `
                <div class="publicacion-body">
                    <h3>${pub.titulo}</h3>
                    <p>${pub.descripcion.substring(0, 100)}...</p>
                </div>`;
            pubContainer.appendChild(card);
        });
    }

    cargarPerfilPublico();
});
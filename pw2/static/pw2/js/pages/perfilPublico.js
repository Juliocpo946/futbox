document.addEventListener('DOMContentLoaded', async () => {
    window.auth.protectRoute();
    
    const container = document.getElementById('perfil-publico-container');
    const nickname = NICKNAME_PERFIL;

    async function cargarPerfilPublico() {
        try {
            const perfil = await window.api.fetchAPI(`/perfil/${nickname}/`);
            const publicaciones = await window.api.fetchAPI(`/perfil/publicaciones/${perfil.id}/`);
            
            renderizarPerfil(perfil);
            renderizarPublicaciones(publicaciones, perfil.nickname);
            
        } catch (error) {
            container.innerHTML = `<h1>Usuario no encontrado</h1><p>El perfil de @${nickname} no existe o no está disponible.</p>`;
        }
    }

    function renderizarPerfil(perfil) {
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
                <h2 id="publicaciones-titulo">Publicaciones de @${perfil.nickname}</h2>
                <div id="publicaciones-container" class="publicaciones-grid"></div>
            </div>
        `;
    }

    function renderizarPublicaciones(publicaciones, nickname) {
        const pubContainer = document.getElementById('publicaciones-container');
        if (publicaciones.length === 0) {
            pubContainer.innerHTML = `<p>@${nickname} aún no tiene publicaciones aprobadas.</p>`;
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
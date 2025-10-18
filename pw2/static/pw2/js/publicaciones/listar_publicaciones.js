document.addEventListener('DOMContentLoaded', async () => {
    if (!window.auth.isLoggedIn()) {
        window.location.href = '/login/';
        return;
    }

    const container = document.getElementById('publicaciones-container');

    async function cargarPublicaciones() {
        try {
            const publicaciones = await window.api.fetchAPI('/publicaciones/');
            renderPublicaciones(publicaciones);
        } catch (error) {
            container.innerHTML = '<p>Error al cargar las publicaciones. Inténtalo de nuevo más tarde.</p>';
            console.error(error);
        }
    }

    function renderPublicaciones(publicaciones) {
        if (publicaciones.length === 0) {
            container.innerHTML = '<p>Aún no hay publicaciones en la comunidad. ¡Sé el primero en publicar!</p>';
            return;
        }

        container.innerHTML = '';
        publicaciones.forEach(pub => {
            const fecha = new Date(pub.fecha_publicacion).toLocaleDateString('es-ES', {
                year: 'numeric', month: 'long', day: 'numeric'
            });
            const card = document.createElement('div');
            card.className = 'publicacion-card';
            
            card.innerHTML = `
                <div class="publicacion-header">
                    <img src="${pub.autor.foto_perfil || '/static/pw2/images/Haerin.jpg'}" alt="Foto de perfil del autor">
                    <div class="publicacion-autor-info">
                        <span class="nombre">${pub.autor.nombre}</span>
                        <p class="fecha"><a href="/perfil/${pub.autor.nickname}/">@${pub.autor.nickname}</a> - ${fecha}</p>
                    </div>
                </div>
                <div class="publicacion-body" style="cursor: pointer;" onclick="window.location.href='/publicaciones/${pub.id}/'">
                    <h3>${pub.titulo}</h3>
                    <p>${pub.descripcion}</p>
                </div>
                <div class="publicacion-footer">
                    <div class="reacciones-info">
                        <i class="fas fa-heart"></i>
                        <span>${pub.reacciones_count} Reacciones</span>
                    </div>
                    <div class="comentarios-info">
                        <i class="fas fa-comment"></i>
                        <span>Comentarios</span>
                    </div>
                </div>
            `;
            container.appendChild(card);
        });
    }

    cargarPublicaciones();
});
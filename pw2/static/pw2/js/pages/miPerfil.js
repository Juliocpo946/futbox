document.addEventListener('DOMContentLoaded', async () => {
    window.auth.protectRoute();

    const lightbox = document.getElementById('image-lightbox');
    const lightboxImg = document.getElementById('lightbox-img');
    const lightboxClose = document.querySelector('.lightbox-close');

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
                            <a href="/editar-perfil/" class="btn-editar-perfil" style="text-decoration: none;">Editar Perfil</a>
                            <button id="logout-button" class="btn-cerrar-sesion">Cerrar Sesion</button>
                        </div>
                    </div>
                </div>
            `;
            document.getElementById('logout-button').addEventListener('click', () => window.auth.logout());
        } catch (error) {
            container.innerHTML = "<p>Error al cargar los datos del perfil.</p>";
        }
    }

    async function cargarMisPublicaciones() {
        const container = document.getElementById('mis-publicaciones-container');
        try {
            const publicaciones = await window.api.fetchAPI('/usuarios/mis-publicaciones/');
            if (publicaciones.length === 0) {
                container.innerHTML = "<p>Aun no has creado ninguna publicacion.</p>";
                return;
            }

            container.innerHTML = '';
            publicaciones.forEach(pub => {
                const card = document.createElement('div');
                card.className = 'publicacion-card';
                card.dataset.id = pub.id;

                const fecha = new Date(pub.fecha_publicacion).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });
                const imagenUrl = pub.multimedia.length > 0 ? pub.multimedia[0].path : '/static/pw2/images/bluelock.jpg';
                
                const estatusClass = `estatus-${pub.estatus}`;
                const estatusTexto = pub.estatus.charAt(0).toUpperCase() + pub.estatus.slice(1);

                card.innerHTML = `
                    <div class="publicacion-media">
                        <img src="${imagenUrl}" alt="${pub.titulo}" class="publicacion-imagen-ampliable">
                    </div>
                    <div class="publicacion-info">
                        <div class="publicacion-header">
                            <img src="${pub.autor.foto_perfil || '/static/pw2/images/Haerin.jpg'}" alt="Foto de perfil">
                            <div class="publicacion-autor-info">
                                <span class="nombre">${pub.autor.nombre}</span>
                                <p class="fecha"><a href="/perfil/${pub.autor.nickname}/">@${pub.autor.nickname}</a> - ${fecha}</p>
                            </div>
                        </div>
                        <div class="publicacion-body" style="${pub.estatus === 'aprobada' ? 'cursor: pointer;' : ''}" ${pub.estatus === 'aprobada' ? `onclick="window.location.href='/publicaciones/${pub.id}/'"` : ''}>
                            <h3>${pub.titulo}</h3>
                            <p>${pub.descripcion}</p>
                        </div>
                        <div class="publicacion-footer">
                           <div class="publicacion-stats">
                                <div class="reacciones-info">
                                    <i class="fas fa-heart"></i>
                                    <span class="reaccion-count">${pub.reacciones_count}</span>
                                </div>
                                <div class="comentarios-info" ${pub.estatus === 'aprobada' ? `onclick="window.location.href='/publicaciones/${pub.id}/'"` : ''} style="${pub.estatus === 'aprobada' ? 'cursor: pointer;' : ''}">
                                    <i class="fas fa-comment"></i>
                                    <span>${pub.comentarios_count}</span>
                                </div>
                                <span class="estatus-publicacion ${estatusClass}" style="margin-left: auto;">${estatusTexto}</span>
                            </div>
                        </div>
                    </div>
                `;
                container.appendChild(card);
            });

        } catch (error) {
            container.innerHTML = "<p>Error al cargar tus publicaciones.</p>";
        }
    }
    
    document.getElementById('mis-publicaciones-container').addEventListener('click', async (e) => {
        const card = e.target.closest('.publicacion-card');
        if (!card) return;

        if (e.target.classList.contains('publicacion-imagen-ampliable')) {
            lightboxImg.src = e.target.src;
            lightbox.classList.add('is-visible');
        }

        if (e.target.closest('.reacciones-info')) {
            const publicacionId = card.dataset.id;
            try {
                const resultado = await window.api.fetchAPI(`/publicaciones/${publicacionId}/reaccionar/`, { method: 'POST' });
                const countSpan = card.querySelector('.reaccion-count');
                let currentCount = parseInt(countSpan.textContent, 10);
                if (resultado.status === 'reaccion_creada') {
                    countSpan.textContent = currentCount + 1;
                } else if (resultado.status === 'reaccion_eliminada') {
                    countSpan.textContent = currentCount - 1;
                }
            } catch (error) {
                alert('Error al procesar la reacción.');
            }
        }
    });

    if (lightboxClose) {
        lightboxClose.addEventListener('click', () => lightbox.classList.remove('is-visible'));
    }
    if (lightbox) {
        lightbox.addEventListener('click', (e) => {
            if (e.target === lightbox) {
                lightbox.classList.remove('is-visible');
            }
        });
    }

    cargarDatosPerfil();
    cargarMisPublicaciones();
});
document.addEventListener('DOMContentLoaded', async () => {
    window.auth.protectRoute();
    
    const container = document.getElementById('perfil-publico-container');
    const nickname = NICKNAME_PERFIL;
    const lightbox = document.getElementById('image-lightbox');
    const lightboxImg = document.getElementById('lightbox-img');
    const lightboxClose = document.querySelector('.lightbox-close');

    async function cargarPerfilPublico() {
        try {
            const perfil = await window.api.fetchAPI(`/perfil/${nickname}/`);
            const publicaciones = await window.api.fetchAPI(`/perfil/publicaciones/${perfil.id}/`);
            
            renderizarPerfil(perfil);
            renderizarPublicaciones(publicaciones, perfil);
            
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

    function renderizarPublicaciones(publicaciones, autor) {
        const pubContainer = document.getElementById('publicaciones-container');
        if (publicaciones.length === 0) {
            pubContainer.innerHTML = `<p>@${autor.nickname} aún no tiene publicaciones aprobadas.</p>`;
            return;
        }
        pubContainer.innerHTML = '';
        publicaciones.forEach(pub => {
            const card = document.createElement('div');
            card.className = 'publicacion-card';
            card.dataset.id = pub.id;

            const fecha = new Date(pub.fecha_publicacion).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });
            const imagenUrl = pub.multimedia.length > 0 ? pub.multimedia[0].path : '/static/pw2/images/bluelock.jpg';

            card.innerHTML = `
                <div class="publicacion-media">
                    <img src="${imagenUrl}" alt="${pub.titulo}" class="publicacion-imagen-ampliable">
                </div>
                <div class="publicacion-info">
                    <div class="publicacion-header">
                        <img src="${autor.foto_perfil || '/static/pw2/images/Haerin.jpg'}" alt="Foto de perfil">
                        <div class="publicacion-autor-info">
                            <span class="nombre">${autor.nombre}</span>
                            <p class="fecha"><a href="/perfil/${autor.nickname}/">@${autor.nickname}</a> - ${fecha}</p>
                        </div>
                    </div>
                    <div class="publicacion-body" style="cursor: pointer;" onclick="window.location.href='/publicaciones/${pub.id}/'">
                        <h3>${pub.titulo}</h3>
                        <p>${pub.descripcion}</p>
                    </div>
                    <div class="publicacion-footer">
                       <div class="publicacion-stats">
                            <div class="reacciones-info">
                                <i class="fas fa-heart"></i>
                                <span class="reaccion-count">${pub.reacciones_count}</span>
                            </div>
                            <div class="comentarios-info" onclick="window.location.href='/publicaciones/${pub.id}/'" style="cursor: pointer;">
                                <i class="fas fa-comment"></i>
                                <span>${pub.comentarios_count}</span>
                            </div>
                        </div>
                        <form class="comentario-form">
                            <textarea placeholder="Añade un comentario..." rows="1"></textarea>
                            <button type="submit">Publicar</button>
                        </form>
                    </div>
                </div>`;
            pubContainer.appendChild(card);
        });
    }

    document.getElementById('perfil-publico-container').addEventListener('click', async (e) => {
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

    document.getElementById('perfil-publico-container').addEventListener('submit', async (e) => {
        if (e.target.classList.contains('comentario-form')) {
            e.preventDefault();
            const card = e.target.closest('.publicacion-card');
            const publicacionId = card.dataset.id;
            const textarea = e.target.querySelector('textarea');
            const texto = textarea.value.trim();

            if (!texto) return;

            try {
                await window.api.fetchAPI(`/publicaciones/${publicacionId}/comentarios/`, {
                    method: 'POST',
                    body: JSON.stringify({ comentario: texto }),
                });
                textarea.value = '';
                alert('Comentario publicado con éxito. Se mostrará en la página de detalles de la publicación.');
                
                const commentCountSpan = card.querySelector('.comentarios-info span');
                let currentCount = parseInt(commentCountSpan.textContent, 10);
                commentCountSpan.textContent = currentCount + 1;

            } catch (error) {
                alert('Error al publicar el comentario.');
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

    cargarPerfilPublico();
});
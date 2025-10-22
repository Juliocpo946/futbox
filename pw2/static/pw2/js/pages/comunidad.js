document.addEventListener('DOMContentLoaded', async () => {
    window.auth.protectRoute();

    const container = document.getElementById('publicaciones-container');
    const searchForm = document.getElementById('search-form-nav');
    const searchInput = document.getElementById('search-input-nav');
    const tituloSeccion = document.getElementById('titulo-seccion');
    const lightbox = document.getElementById('image-lightbox');
    const lightboxImg = document.getElementById('lightbox-img');
    const lightboxClose = document.querySelector('.lightbox-close');

    async function cargarPublicaciones(query = '') {
        try {
            const endpoint = query ? `/publicaciones/?search=${encodeURIComponent(query)}` : '/publicaciones/';
            if (query) {
                tituloSeccion.innerHTML = `Resultados para: <span class="query-term">"${query}"</span>`;
            } else {
                tituloSeccion.textContent = 'Comunidad';
            }
            const publicaciones = await window.api.fetchAPI(endpoint);
            renderPublicaciones(publicaciones);
        } catch (error) {
            container.innerHTML = '<p>Error al cargar las publicaciones. Inténtalo de nuevo más tarde.</p>';
        }
    }

    function renderPublicaciones(publicaciones) {
        if (publicaciones.length === 0) {
            container.innerHTML = '<p>No se encontraron publicaciones. ¡Sé el primero en publicar!</p>';
            return;
        }

        container.innerHTML = '';
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
                        <img src="${pub.autor.foto_perfil || '/static/pw2/images/Haerin.jpg'}" alt="Foto de perfil">
                        <div class="publicacion-autor-info">
                            <span class="nombre">${pub.autor.nombre}</span>
                            <p class="fecha"><a href="/perfil/${pub.autor.nickname}/">@${pub.autor.nickname}</a> - ${fecha}</p>
                        </div>
                    </div>
                    <div class="publicacion-body">
                        <h3>${pub.titulo}</h3>
                        <p>${pub.descripcion}</p>
                    </div>
                    <div class="publicacion-footer">
                        <div class="publicacion-stats">
                            <div class="reacciones-info">
                                <i class="fas fa-heart"></i>
                                <span class="reaccion-count">${pub.reacciones_count}</span>
                            </div>
                            <div class="comentarios-info">
                                <i class="fas fa-comment"></i>
                                <span>${pub.comentarios_count}</span>
                            </div>
                        </div>
                        <form class="comentario-form">
                            <textarea placeholder="Añade un comentario..." rows="1"></textarea>
                            <button type="submit">Publicar</button>
                        </form>
                    </div>
                </div>
            `;
            container.appendChild(card);
        });
    }

    container.addEventListener('click', async (e) => {
        const card = e.target.closest('.publicacion-card');
        if (!card) return;

        const publicacionId = card.dataset.id;

        if (e.target.classList.contains('publicacion-imagen-ampliable')) {
            lightboxImg.src = e.target.src;
            lightbox.style.display = 'flex';
        }

        if (e.target.closest('.reacciones-info')) {
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

    container.addEventListener('submit', async (e) => {
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
                alert('Comentario publicado con éxito.');
            } catch (error) {
                alert('Error al publicar el comentario.');
            }
        }
    });

    if (lightboxClose) {
        lightboxClose.addEventListener('click', () => lightbox.style.display = 'none');
    }
    if (lightbox) {
        lightbox.addEventListener('click', (e) => {
            if (e.target === lightbox) {
                lightbox.style.display = 'none';
            }
        });
    }

    searchForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const query = searchInput.value.trim();
        cargarPublicaciones(query);
    });

    const pendingQuery = sessionStorage.getItem('searchQuery');
    if (pendingQuery) {
        searchInput.value = pendingQuery;
        cargarPublicaciones(pendingQuery);
        sessionStorage.removeItem('searchQuery');
    } else {
        cargarPublicaciones();
    }
});
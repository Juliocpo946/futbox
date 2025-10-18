document.addEventListener('DOMContentLoaded', async () => {
    if (!window.auth.isLoggedIn()) {
        window.location.href = '/login/';
        return;
    }

    const container = document.getElementById('detalle-container');
    
    async function cargarDetalle() {
        try {
            const publicacion = await window.api.fetchAPI(`/publicaciones/${PUBLICACION_ID}/`);
            const comentarios = await window.api.fetchAPI(`/publicaciones/${PUBLICACION_ID}/comentarios/`);
            renderDetalle(publicacion, comentarios);
            setupComentarioForm();
            setupReaccionButton();
        } catch (error) {
            container.innerHTML = `<p>Error al cargar la publicación. Es posible que no exista o haya sido eliminada.</p>`;
            console.error(error);
        }
    }

    function renderDetalle(pub, comentarios) {
        const fechaPub = new Date(pub.fecha_publicacion).toLocaleString('es-ES');
        let multimediaHTML = '';
        if (pub.multimedia && pub.multimedia.length > 0) {
            multimediaHTML = `<div class="detalle-multimedia"><img src="${pub.multimedia[0].path}" alt="${pub.titulo}"></div>`;
        }
        
        container.innerHTML = `
            <div class="detalle-publicacion-card">
                <div class="detalle-header">
                    <img class="autor-pic" src="${pub.autor.foto_perfil || '/static/pw2/images/Haerin.jpg'}" alt="Foto de perfil">
                    <div class="detalle-autor">
                        <span class="nombre">${pub.autor.nombre}</span>
                        <p class="fecha"><a href="/perfil/${pub.autor.nickname}/">@${pub.autor.nickname}</a> - ${fechaPub}</p>
                    </div>
                </div>
                <div class="detalle-body">
                    <h1>${pub.titulo}</h1>
                    <p class="descripcion">${pub.descripcion}</p>
                    ${multimediaHTML}
                </div>
                <div class="detalle-footer">
                    <button class="reaccion-btn" id="reaccion-btn">
                        <i class="fas fa-heart"></i>
                        <span id="reaccion-count">${pub.reacciones_count}</span>
                    </button>
                </div>
            </div>
            <div class="comentarios-section">
                <h2>Comentarios</h2>
                <form class="nuevo-comentario-form" id="comentario-form">
                    <textarea id="comentario-texto" placeholder="Escribe tu comentario..." required></textarea>
                    <button type="submit">Comentar</button>
                </form>
                <div id="comentarios-lista"></div>
            </div>
        `;
        renderComentarios(comentarios);
    }

    function renderComentarios(comentarios) {
        const listaComentarios = document.getElementById('comentarios-lista');
        listaComentarios.innerHTML = '';
        if (comentarios.length === 0) {
            listaComentarios.innerHTML = '<p>No hay comentarios todavía. ¡Sé el primero en comentar!</p>';
            return;
        }
        comentarios.forEach(com => {
            const fechaCom = new Date(com.fecha_creacion).toLocaleString('es-ES');
            const comentarioCard = document.createElement('div');
            comentarioCard.className = 'comentario-card';
            comentarioCard.innerHTML = `
                <div class="comentario-header">
                    <strong><a href="/perfil/${com.usuario.nickname}/">@${com.usuario.nickname}</a></strong>
                    <span>- ${fechaCom}</span>
                </div>
                <div class="comentario-body">
                    <p>${com.comentario}</p>
                </div>
            `;
            listaComentarios.appendChild(comentarioCard);
        });
    }
    
    function setupComentarioForm() {
        const form = document.getElementById('comentario-form');
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const texto = document.getElementById('comentario-texto').value;
            if (!texto.trim()) return;
            try {
                await window.api.fetchAPI(`/publicaciones/${PUBLICACION_ID}/comentarios/`, {
                    method: 'POST',
                    body: JSON.stringify({ comentario: texto }),
                });
                cargarDetalle();
            } catch (error) {
                alert('Error al enviar el comentario.');
            }
        });
    }

    function setupReaccionButton() {
        const btn = document.getElementById('reaccion-btn');
        const countSpan = document.getElementById('reaccion-count');
        btn.addEventListener('click', async () => {
            try {
                const resultado = await window.api.fetchAPI(`/publicaciones/${PUBLICACION_ID}/reaccionar/`, {
                    method: 'POST'
                });
                let currentCount = parseInt(countSpan.textContent, 10);
                if (resultado.status === 'reaccion_creada') {
                    countSpan.textContent = currentCount + 1;
                    btn.classList.add('reaccionado');
                } else if (resultado.status === 'reaccion_eliminada') {
                    countSpan.textContent = currentCount - 1;
                    btn.classList.remove('reaccionado');
                }
            } catch (error) {
                alert('Error al procesar la reacción.');
            }
        });
    }

    cargarDetalle();
});
document.addEventListener('DOMContentLoaded', async () => {
    // Proteger la ruta
    window.auth.protectRoute();

    const container = document.getElementById('detalle-container');
    const publicacionId = PUBLICACION_ID; // Variable inyectada desde el template

    async function cargarDetalleCompleto() {
        try {
            // Hacemos las peticiones en paralelo para mayor eficiencia
            const [publicacion, comentarios] = await Promise.all([
                window.api.fetchAPI(`/publicaciones/${publicacionId}/`),
                window.api.fetchAPI(`/publicaciones/${publicacionId}/comentarios/`)
            ]);
            
            renderizarDetalle(publicacion);
            renderizarComentarios(comentarios);
            
            // Una vez renderizado todo, asignamos los eventos a los nuevos elementos
            configurarFormularioComentario();
            configurarBotonReaccion();

        } catch (error) {
            container.innerHTML = `<p>Error al cargar la publicación. Es posible que no exista o haya sido eliminada.</p>`;
            console.error(error);
        }
    }

    function renderizarDetalle(pub) {
        const fechaPub = new Date(pub.fecha_publicacion).toLocaleString('es-ES', { dateStyle: 'long', timeStyle: 'short' });
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
                    <p class="descripcion">${pub.descripcion.replace(/\n/g, '<br>')}</p>
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
                <div id="comentarios-lista">
                    </div>
            </div>
        `;
    }

    function renderizarComentarios(comentarios) {
        const listaComentarios = document.getElementById('comentarios-lista');
        if (!listaComentarios) return;

        listaComentarios.innerHTML = '';
        if (comentarios.length === 0) {
            listaComentarios.innerHTML = '<p>No hay comentarios todavía. ¡Sé el primero en comentar!</p>';
            return;
        }

        comentarios.forEach(com => {
            const fechaCom = new Date(com.fecha_creacion).toLocaleString('es-ES', { dateStyle: 'medium', timeStyle: 'short' });
            const comentarioCard = document.createElement('div');
            comentarioCard.className = 'comentario-card';
            comentarioCard.innerHTML = `
                <div class="comentario-header">
                    <img src="${com.usuario.foto_perfil || '/static/pw2/images/Haerin.jpg'}" alt="Foto de perfil">
                    <div class="comentario-autor-info">
                        <strong><a href="/perfil/${com.usuario.nickname}/">@${com.usuario.nickname}</a></strong>
                        <span>- ${fechaCom}</span>
                    </div>
                </div>
                <div class="comentario-body">
                    <p>${com.comentario}</p>
                </div>
            `;
            listaComentarios.appendChild(comentarioCard);
        });
    }
    
    function configurarFormularioComentario() {
        const form = document.getElementById('comentario-form');
        const textarea = document.getElementById('comentario-texto');
        if (!form) return;

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const texto = textarea.value.trim();
            if (!texto) return;

            try {
                // Deshabilitar el botón para evitar doble envío
                form.querySelector('button').disabled = true;

                await window.api.fetchAPI(`/publicaciones/${publicacionId}/comentarios/`, {
                    method: 'POST',
                    body: JSON.stringify({ comentario: texto }),
                });
                
                // Limpiar el textarea y recargar solo la sección de comentarios
                textarea.value = '';
                const nuevosComentarios = await window.api.fetchAPI(`/publicaciones/${publicacionId}/comentarios/`);
                renderizarComentarios(nuevosComentarios);

            } catch (error) {
                alert('Error al enviar el comentario.');
            } finally {
                // Volver a habilitar el botón
                form.querySelector('button').disabled = false;
            }
        });
    }

    function configurarBotonReaccion() {
        const btn = document.getElementById('reaccion-btn');
        const countSpan = document.getElementById('reaccion-count');
        if (!btn) return;
        
        btn.addEventListener('click', async () => {
            try {
                btn.disabled = true; // Prevenir múltiples clics
                const resultado = await window.api.fetchAPI(`/publicaciones/${publicacionId}/reaccionar/`, {
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
            } finally {
                btn.disabled = false;
            }
        });
    }

    // Iniciar la carga de la página
    cargarDetalleCompleto();
});
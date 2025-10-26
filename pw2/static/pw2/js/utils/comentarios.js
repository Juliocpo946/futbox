async function cargarYRenderizarComentariosPreview(publicacionId) {
    const previewContainer = document.querySelector(`.card-comentarios-preview[data-pub-id="${publicacionId}"]`);
    if (!previewContainer) return;

    try {
        const comentarios = await window.api.fetchAPI(`/publicaciones/${publicacionId}/comentarios/`);
        const ultimosComentarios = comentarios;

        if (ultimosComentarios.length === 0) {
            previewContainer.innerHTML = '<p class="no-comments">Sin comentarios aún.</p>';
            return;
        }

        let comentariosHTML = '';
        ultimosComentarios.forEach(com => {
            const profilePicHTML = com.usuario.foto_perfil ? `<img src="${com.usuario.foto_perfil}" alt="Avatar">` : `<i class="fas fa-user-circle profile-placeholder-icon-small"></i>`;
            const textoCorto = com.comentario.substring(0, 50);
            const textoFinal = com.comentario.length > 50 ? textoCorto + '...' : textoCorto;
            comentariosHTML += `<div class="card-comentario-item"><div class="card-comentario-autor">${profilePicHTML}<strong><a href="/perfil/${com.usuario.nickname}/">@${com.usuario.nickname}</a>:</strong></div><p>${textoFinal}</p></div>`;
        });
        previewContainer.innerHTML = comentariosHTML;

    } catch (error) {
        previewContainer.innerHTML = '<p class="error-comments">Error al cargar comentarios.</p>';
        console.error(`Error cargando comentarios para pub ${publicacionId}:`, error);
    }
}

async function manejarReaccion(publicacionId, card, cachedPublications, publicationIndex) {
    try {
        const resultado = await window.api.fetchAPI(`/publicaciones/${publicacionId}/reaccionar/`, { method: 'POST' });
        const countSpan = card.querySelector('.reaccion-count');
        if (countSpan) {
            let currentCount = parseInt(countSpan.textContent, 10);
            if (resultado.status === 'reaccion_creada') countSpan.textContent = currentCount + 1;
            else if (resultado.status === 'reaccion_eliminada' && currentCount > 0) countSpan.textContent = currentCount - 1;
            if (cachedPublications && cachedPublications[publicationIndex]) {
                cachedPublications[publicationIndex].reacciones_count = parseInt(countSpan.textContent, 10);
            }
        }
    } catch (error) {
        alert('Error al procesar la reacción.');
    }
}

async function manejarComentario(e, publicacionId, card, cachedPublications, publicationIndex) {
    e.preventDefault();
    const textarea = e.target.querySelector('textarea');
    const texto = textarea.value.trim();
    if (!texto) return;

    const button = e.target.querySelector('button');
    try {
        if (button) button.disabled = true;
        await window.api.fetchAPI(`/publicaciones/${publicacionId}/comentarios/`, {
            method: 'POST',
            body: JSON.stringify({ comentario: texto }),
        });
        textarea.value = '';

        const commentInfo = card.querySelector('.comentarios-info span');
        if (commentInfo) {
            let currentCount = parseInt(commentInfo.textContent, 10);
            commentInfo.textContent = currentCount + 1;
            if (cachedPublications && cachedPublications[publicationIndex]) {
                cachedPublications[publicationIndex].comentarios_count = currentCount + 1;
            }
        }
        cargarYRenderizarComentariosPreview(publicacionId);
    } catch (error) {
        alert('Error al publicar el comentario.');
    } finally {
        if (button) button.disabled = false;
    }
}

window.comentariosUtils = {
    cargarYRenderizarComentariosPreview,
    manejarReaccion,
    manejarComentario
};
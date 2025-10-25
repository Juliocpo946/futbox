function generarMetaHTML(pub) {
    let metaHTML = '<div class="publicacion-meta">';
    if (pub.categoria && pub.categoria.nombre) {
        metaHTML += `<span class="publicacion-meta-item"><i class="fas fa-tags"></i> ${pub.categoria.nombre}</span>`;
    }
    if (pub.mundial && pub.mundial.año) {
        const mundialNombre = pub.mundial.nombre || `Mundial ${pub.mundial.año}`;
        metaHTML += `<span class="publicacion-meta-item"><i class="fas fa-trophy"></i> ${mundialNombre}</span>`;
    }
    metaHTML += '</div>';
    return metaHTML;
}

function generarProfilePicHTML(usuario, size = 'normal') {
    if (usuario.foto_perfil) {
        return `<img src="${usuario.foto_perfil}" alt="Foto de perfil">`;
    }
    const sizeClass = size === 'small' ? 'profile-placeholder-icon-small' : 'profile-placeholder-icon';
    return `<i class="fas fa-user-circle ${sizeClass}"></i>`;
}

function generarMediaHTML(multimedia) {
    if (!multimedia || multimedia.length === 0) {
        return {
            html: `<span class="media-placeholder-icon"><i class="far fa-image"></i></span>`,
            indicator: ''
        };
    }

    const firstItem = multimedia[0];
    let mediaHTML;
    
    if (firstItem.media_type === 'image') {
        mediaHTML = `<img src="${firstItem.path}" alt="Multimedia" data-media-index="0">`;
    } else if (firstItem.media_type === 'video') {
        mediaHTML = `<video muted loop playsinline src="${firstItem.path}#t=0.5" preload="metadata" data-media-index="0"></video>`;
    } else {
        mediaHTML = `<span class="media-placeholder-icon"><i class="fas fa-ban"></i></span>`;
    }

    const indicator = multimedia.length > 1 
        ? `<span class="multi-media-indicator"><i class="fas fa-images"></i> ${multimedia.length}</span>`
        : '';

    return { html: mediaHTML, indicator };
}

function crearCardPublicacion(pub, pubIndex, incluirEstatus = false) {
    const fecha = new Date(pub.fecha_publicacion).toLocaleDateString('es-ES', {
        year: 'numeric', month: 'long', day: 'numeric'
    });

    const profilePicHTML = generarProfilePicHTML(pub.autor);
    const { html: mediaHTML, indicator: mediaIndicatorHTML } = generarMediaHTML(pub.multimedia);
    const metaHTML = generarMetaHTML(pub);

    const card = document.createElement('div');
    card.className = 'publicacion-card';
    card.dataset.id = pub.id;
    card.dataset.index = pubIndex;

    const estatusHTML = incluirEstatus ? `
        <span class="estatus-publicacion estatus-${pub.estatus}" style="margin-left: auto;">
            ${pub.estatus.charAt(0).toUpperCase() + pub.estatus.slice(1)}
        </span>
    ` : '';

    const comentariosPreviewHTML = pub.estatus === 'aprobada' || !incluirEstatus ? `
        <div class="card-comentarios-preview" data-pub-id="${pub.id}">
            <p class="loading-comments">Cargando comentarios...</p>
        </div>
    ` : '';

    const comentarioFormHTML = pub.estatus === 'aprobada' || !incluirEstatus ? `
        <form class="comentario-form">
            <textarea placeholder="Añade un comentario..." rows="1"></textarea>
            <button type="submit">Publicar</button>
        </form>
    ` : '';

    const onclickBody = pub.estatus === 'aprobada' || !incluirEstatus 
        ? `onclick="window.location.href='/publicaciones/${pub.id}/'"` 
        : '';

    const onclickComentarios = pub.estatus === 'aprobada' || !incluirEstatus
        ? `onclick="window.location.href='/publicaciones/${pub.id}/#comentarios-section'" style="cursor: pointer;"`
        : '';

    card.innerHTML = `
        <div class="publicacion-media">
            ${mediaHTML}
            ${mediaIndicatorHTML}
        </div>
        <div class="publicacion-info">
            <div class="publicacion-header">
                ${profilePicHTML}
                <div class="publicacion-autor-info">
                    <span class="nombre">${pub.autor.nombre}</span>
                    <p class="fecha"><a href="/perfil/${pub.autor.nickname}/">@${pub.autor.nickname}</a> - ${fecha}</p>
                </div>
            </div>
            <div class="publicacion-body" ${onclickBody} style="${pub.estatus === 'aprobada' || !incluirEstatus ? 'cursor: pointer;' : ''}">
                <h3>${pub.titulo}</h3>
                ${metaHTML}
                <p>${pub.descripcion}</p>
            </div>
            <div class="publicacion-footer">
                ${comentariosPreviewHTML}
                <div class="publicacion-stats">
                    <div class="reacciones-info">
                        <i class="fas fa-heart"></i>
                        <span class="reaccion-count">${pub.reacciones_count}</span>
                    </div>
                    <div class="comentarios-info" ${onclickComentarios}>
                        <i class="fas fa-comment"></i>
                        <span>${pub.comentarios_count}</span>
                    </div>
                    ${estatusHTML}
                </div>
                ${comentarioFormHTML}
            </div>
        </div>
    `;
    
    return card;
}

function agregarEstilosIndicador() {
    if (!document.head.querySelector('style[data-indicator-style]')) {
        const style = document.createElement('style');
        style.setAttribute('data-indicator-style', 'true');
        style.textContent = `
            .publicacion-media { position: relative; }
            .multi-media-indicator {
                position: absolute; top: 10px; right: 10px;
                background-color: rgba(0, 0, 0, 0.6); color: white;
                padding: 3px 8px; border-radius: 10px; font-size: 0.8em; z-index: 5;
            }
        `;
        document.head.appendChild(style);
    }
}

window.publicacionesUtils = {
    generarMetaHTML,
    generarProfilePicHTML,
    generarMediaHTML,
    crearCardPublicacion,
    agregarEstilosIndicador
};
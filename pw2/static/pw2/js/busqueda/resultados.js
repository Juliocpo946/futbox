document.addEventListener('DOMContentLoaded', async () => {
    if (!window.auth.isLoggedIn()) {
        window.location.href = '/login/';
        return;
    }

    const container = document.getElementById('resultados-container');
    const titulo = document.getElementById('titulo-resultados');

    const urlParams = new URLSearchParams(window.location.search);
    const query = urlParams.get('q');

    if (!query) {
        titulo.textContent = 'No se especificó un término de búsqueda.';
        return;
    }

    titulo.innerHTML = `Resultados para: <span class="query-term">"${query}"</span>`;

    async function buscarPublicaciones() {
        try {
            const resultados = await window.api.fetchAPI(`/publicaciones/?search=${encodeURIComponent(query)}`);
            renderResultados(resultados);
        } catch (error) {
            container.innerHTML = '<p>Error al realizar la búsqueda. Inténtalo de nuevo más tarde.</p>';
            console.error(error);
        }
    }

    function renderResultados(resultados) {
        if (resultados.length === 0) {
            container.innerHTML = '<p>No se encontraron publicaciones que coincidan con tu búsqueda.</p>';
            return;
        }

        container.innerHTML = '';
        resultados.forEach(pub => {
            const fecha = new Date(pub.fecha_publicacion).toLocaleDateString('es-ES');
            const card = document.createElement('div');
            card.className = 'publicacion-card';
            card.style.cursor = 'pointer';
            card.onclick = () => { window.location.href = `/publicaciones/${pub.id}/`; };

            card.innerHTML = `
                <div class="publicacion-header">
                    <div class="publicacion-autor-info">
                        <span class="nombre">${pub.autor.nombre}</span>
                        <p class="fecha">@${pub.autor.nickname} - ${fecha}</p>
                    </div>
                </div>
                <div class="publicacion-body">
                    <h3>${pub.titulo}</h3>
                    <p>${pub.descripcion.substring(0, 150)}...</p>
                </div>
            `;
            container.appendChild(card);
        });
    }

    buscarPublicaciones();
});
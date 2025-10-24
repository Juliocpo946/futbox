document.addEventListener('DOMContentLoaded', async () => {
    window.auth.protectRoute();
    const userData = window.auth.getUserData();
    if (!userData || userData.rol !== 'admin') {
        window.location.href = '/';
        return;
    }

    const container = document.getElementById('usuarios-container');

    async function cargarUsuarios() {
        try {
            const usuarios = await window.api.fetchAPI('/admin/usuarios/');
            renderTablaUsuarios(usuarios);
        } catch (error) {
            container.innerHTML = `<p>Error al cargar los usuarios: ${error.message}</p>`;
        }
    }

    function renderTablaUsuarios(usuarios) {
        let tableHTML = `
            <table class="admin-table">
                <thead>
                    <tr>
                        <th>Nickname</th>
                        <th>Nombre</th>
                        <th>Correo</th>
                        <th>Rol</th>
                    </tr>
                </thead>
                <tbody>
        `;

        usuarios.forEach(user => {
            const esAdmin = user.rol === 'admin';
            tableHTML += `
                <tr id="user-row-${user.id}">
                    <td>@${user.nickname}</td>
                    <td>${user.nombre} ${user.apellido_paterno || ''}</td>
                    <td>${user.correo}</td>
                    <td>
                        <select data-id="${user.id}" class="rol-select" ${userData.id === user.id ? 'disabled' : ''}>
                            <option value="usuario" ${!esAdmin ? 'selected' : ''}>Usuario</option>
                            <option value="admin" ${esAdmin ? 'selected' : ''}>Admin</option>
                        </select>
                    </td>
                </tr>
            `;
        });

        tableHTML += '</tbody></table>';
        container.innerHTML = tableHTML;
    }

    container.addEventListener('change', async (e) => {
        const userId = e.target.dataset.id;
        if (!userId || !e.target.classList.contains('rol-select')) return;

        const nuevoRol = e.target.value;
        const nickname = document.querySelector(`#user-row-${userId} td`).textContent;

        if (confirm(`¿Estás seguro de que quieres cambiar el rol de ${nickname} a ${nuevoRol}?`)) {
            await cambiarRolUsuario(userId, nuevoRol);
        } else {
            e.target.value = nuevoRol === 'admin' ? 'usuario' : 'admin';
        }
    });

    async function cambiarRolUsuario(id, rol) {
        try {
            await window.api.fetchAPI(`/admin/usuarios/${id}/`, {
                method: 'PUT',
                body: JSON.stringify({ rol: rol }),
            });
        } catch (error) {
            alert(`Error al cambiar el rol: ${error.message}`);
            cargarUsuarios();
        }
    }

    cargarUsuarios();
});
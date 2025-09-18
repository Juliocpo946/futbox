document.addEventListener('DOMContentLoaded', () => {
    const dropdownBtn = document.getElementById('profile-dropdown-btn');
    const dropdownMenu = document.getElementById('profile-dropdown-menu');
    const dropdownIcon = document.querySelector('.profile-dropdown-icon');

    if (dropdownBtn) {
        dropdownBtn.addEventListener('click', (e) => {
            e.preventDefault();
            dropdownMenu.classList.toggle('visible');
            dropdownIcon.classList.toggle('rotated');
        });
    }

    document.addEventListener('click', (e) => {
        if (!dropdownBtn.contains(e.target) && !dropdownMenu.contains(e.target)) {
            dropdownMenu.classList.remove('visible');
            dropdownIcon.classList.remove('rotated');
        }
    });
});
// Manejo del menú de categorías en móvil
document.addEventListener('DOMContentLoaded', function() {
    const dropdownBtn = document.querySelector('.categorias-dropdown-btn');
    const categoriasList = document.querySelector('.categorias-lista');
    const categoriaItems = document.querySelectorAll('.categoria-item');

    // Mostrar/ocultar menú al hacer clic en el botón
    if (dropdownBtn) {
        dropdownBtn.addEventListener('click', function() {
            this.classList.toggle('active');
            categoriasList.classList.toggle('show');
        });
    }

    // En móvil, mostrar/ocultar subcategorías al hacer clic
    if (window.innerWidth <= 768) {
        categoriaItems.forEach(item => {
            const link = item.querySelector('.categoria-link');
            const subcategorias = item.querySelector('.subcategorias');
            
            if (link && subcategorias) {
                link.addEventListener('click', function(e) {
                    if (window.innerWidth <= 768) {
                        e.preventDefault();
                        item.classList.toggle('active');
                    }
                });
            }
        });
    }

    // Cerrar el menú si se hace clic fuera de él
    document.addEventListener('click', function(e) {
        if (!e.target.closest('.categorias-nav') && categoriasList.classList.contains('show')) {
            dropdownBtn.classList.remove('active');
            categoriasList.classList.remove('show');
        }
    });
});

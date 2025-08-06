// Manejo del menú de categorías en móvil
document.addEventListener('DOMContentLoaded', function() {
    const dropdownBtn = document.querySelector('.categorias-dropdown-btn');
    const categoriasList = document.querySelector('.categorias-lista');
    const categoriaItems = document.querySelectorAll('.categoria-item');

    // Mostrar/ocultar menú al hacer clic en el botón
    if (dropdownBtn) {
        dropdownBtn.addEventListener('click', function() {
            this.classList.toggle('active');
            // Protección adicional para categoriasList
            if (categoriasList) {
                categoriasList.classList.toggle('show');
            }
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
        // Protección para categoriasList antes de usarlo
        if (!e.target.closest('.categorias-nav') && categoriasList && categoriasList.classList.contains('show')) {
            if (dropdownBtn) { // Asegurarse de que dropdownBtn también exista
                dropdownBtn.classList.remove('active');
            }
            categoriasList.classList.remove('show');
        }
    });

    // Soporte para pantallas redimensionadas: recargar la página cuando sea necesario
    // Se utiliza debounce para evitar recargas múltiples durante el redimensionado y
    // solo se recarga si se cruza el umbral de 768px entre estados.
    let resizeTimeout;
    let lastWidth = window.innerWidth;

    window.addEventListener('resize', function() {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(function() {
            const newWidth = window.innerWidth;
            const crossedBreakpoint = (lastWidth <= 768 && newWidth > 768) || (lastWidth > 768 && newWidth <= 768);
            if (crossedBreakpoint) {
                location.reload();
            }
            lastWidth = newWidth;
        }, 200);
    });

    window.addEventListener('orientationchange', function() {
        location.reload();
    });
});

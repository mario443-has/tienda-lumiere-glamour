// Espera a que el DOM esté completamente cargado antes de ejecutar el script
document.addEventListener('DOMContentLoaded', () => {

    // Variable global para evitar múltiples peticiones
    let isFetching = false;
    const mainContent = document.querySelector('main');

    // Función para mostrar y ocultar un spinner de carga
    const toggleLoading = (show) => {
        let loadingSpinner = document.getElementById('loading-spinner');
        if (show) {
            if (!loadingSpinner) {
                loadingSpinner = document.createElement('div');
                loadingSpinner.id = 'loading-spinner';
                loadingSpinner.className = 'fixed inset-0 bg-white bg-opacity-75 flex items-center justify-center z-50 transition-opacity duration-300 opacity-0';
                loadingSpinner.innerHTML = '<div class="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-pink-600"></div>';
                document.body.appendChild(loadingSpinner);
                setTimeout(() => loadingSpinner.style.opacity = '1', 10);
            }
        } else {
            if (loadingSpinner) {
                loadingSpinner.style.opacity = '0';
                setTimeout(() => loadingSpinner.remove(), 300);
            }
        }
    };
    
    // Función principal para manejar el clic en los enlaces de paginación
    const handlePaginationClick = (event) => {
        // Previene la recarga de la página al hacer clic en un enlace
        event.preventDefault();
        
        // Evita múltiples peticiones si ya se está cargando una
        if (isFetching) return;

        const link = event.target.closest('a');
        if (!link || link.classList.contains('cursor-not-allowed')) {
            return;
        }
        const url = link.href;

        isFetching = true;
        toggleLoading(true);

        // Realiza una petición Fetch para obtener el nuevo contenido de la página
        fetch(url)
            .then(response => response.text())
            .then(html => {
                // Crea un documento temporal para analizar el HTML recibido
                const parser = new DOMParser();
                const doc = parser.parseFromString(html, 'text/html');

                // Extrae el nuevo contenido de la cuadrícula de productos y la paginación
                const newProductGrid = doc.getElementById('product-grid');
                const newPaginationContainer = doc.getElementById('pagination-container');

                // Reemplaza el contenido actual con el nuevo contenido
                const currentProductGrid = document.getElementById('product-grid');
                const currentPaginationContainer = document.getElementById('pagination-container');

                if (currentProductGrid && newProductGrid) {
                    currentProductGrid.innerHTML = newProductGrid.innerHTML;
                }
                if (currentPaginationContainer && newPaginationContainer) {
                    currentPaginationContainer.innerHTML = newPaginationContainer.innerHTML;
                } else if (currentPaginationContainer && !newPaginationContainer) {
                    // Oculta la paginación si ya no es necesaria
                    currentPaginationContainer.style.display = 'none';
                }
                
                // Actualiza la URL en el historial del navegador sin recargar la página
                history.pushState({}, '', url);

                // Vuelve a adjuntar los listeners de eventos a los nuevos enlaces
                attachPaginationListeners();
            })
            .catch(error => {
                console.error('Error al cargar la nueva página de productos:', error);
                // Aquí podrías mostrar un mensaje de error al usuario
            })
            .finally(() => {
                // Finaliza el estado de carga
                isFetching = false;
                toggleLoading(false);
                // Desplaza la vista a la parte superior de la sección de productos
                if (mainContent) {
                    mainContent.scrollIntoView({ behavior: 'smooth' });
                }
            });
    };

    // Función para adjuntar los listeners de eventos a los enlaces de paginación
    const attachPaginationListeners = () => {
        const paginationLinks = document.querySelectorAll('#pagination-container a');
        paginationLinks.forEach(link => {
            link.removeEventListener('click', handlePaginationClick);
            link.addEventListener('click', handlePaginationClick);
        });
    };

    // Llama a la función al cargar la página para que la paginación sea interactiva desde el inicio
    attachPaginationListeners();

});
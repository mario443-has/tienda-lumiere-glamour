// =====================================================================
// Script de paginación asíncrona optimizado
// Este script maneja la carga de productos sin recargar la página completa.
// =====================================================================

document.addEventListener('DOMContentLoaded', function() {

    // Referencias a los contenedores principales del DOM
    // Asegúrate de que estos IDs existan en tu archivo 'index.html'
    const productosContainer = document.getElementById('productos-grid');
    const paginacionContainer = document.getElementById('pagination-container');
    const loadingSpinner = document.getElementById('loading-spinner');

    /**
     * Muestra el spinner de carga.
     */
    function showLoading() {
        if (loadingSpinner) {
            loadingSpinner.classList.remove('hidden');
        }
        if (productosContainer) {
            // Opcional: Ocultar los productos actuales mientras se carga el nuevo contenido
            productosContainer.style.opacity = '0.5';
            productosContainer.style.pointerEvents = 'none';
        }
    }

    /**
     * Oculta el spinner de carga y restaura la visibilidad de los productos.
     */
    function hideLoading() {
        if (loadingSpinner) {
            loadingSpinner.classList.add('hidden');
        }
        if (productosContainer) {
            productosContainer.style.opacity = '1';
            productosContainer.style.pointerEvents = 'auto';
        }
    }

    /**
     * Re-adjunta los escuchadores de eventos de clic a los enlaces de paginación.
     * Esta función debe ser llamada al cargar la página y después de cada
     * nueva solicitud AJAX exitosa para que los nuevos enlaces funcionen.
     */
    function setupPaginationListeners() {
        if (!paginacionContainer) return;

        // Selecciona todos los enlaces de paginación dentro del contenedor
        const paginationLinks = paginacionContainer.querySelectorAll('a[href]');

        paginationLinks.forEach(link => {
            // Elimina cualquier escuchador de eventos anterior para evitar duplicados
            link.removeEventListener('click', handlePaginationClick);
            // Adjunta el nuevo escuchador
            link.addEventListener('click', handlePaginationClick);
        });
    }

    /**
     * Maneja el evento de clic en los enlaces de paginación.
     * @param {Event} e - El objeto del evento de clic.
     */
    async function handlePaginationClick(e) {
        e.preventDefault(); // Previene la recarga de la página

        const url = this.href;
        showLoading();

        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            const html = await response.text();

            // Parsea la respuesta HTML a un objeto DOM temporal
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');

            // Extrae los nuevos productos y la paginación del documento temporal
            const newProductosContainer = doc.getElementById('productos-grid');
            const newPaginacionContainer = doc.getElementById('pagination-container');

            if (newProductosContainer && productosContainer) {
                // Reemplaza el contenido actual con el nuevo
                productosContainer.innerHTML = newProductosContainer.innerHTML;
            }

            if (newPaginacionContainer && paginacionContainer) {
                // Reemplaza los controles de paginación actuales con los nuevos
                paginacionContainer.innerHTML = newPaginacionContainer.innerHTML;
            }

            // Vuelve a configurar los escuchadores de eventos para los nuevos enlaces de paginación
            setupPaginationListeners();

        // Aplica nuevamente las animaciones si la función está definida
            if (typeof initProductAnimations === 'function') {
                initProductAnimations();
            }

        } catch (error) {
            console.error('Error al cargar la página de productos:', error);
            // Puedes mostrar un mensaje de error al usuario aquí
        } finally {
            hideLoading();
        }

        async function handlePaginationClick(e) {
    e.preventDefault(); 

    const href = this.getAttribute('href');
    const url = new URL(href, window.location.href).toString();

    console.log("DEBUG → Click en link:", href);
    console.log("DEBUG → URL resuelta:", url);

    showLoading();

    try {
        const response = await fetch(url);
        console.log("DEBUG → Status respuesta:", response.status);

        const html = await response.text();

        // Parsea
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');

        const newProductosContainer = doc.getElementById('productos-grid');
        const newPaginacionContainer = doc.getElementById('pagination-container');

        console.log("DEBUG → ¿newProductosContainer encontrado?", !!newProductosContainer);
        console.log("DEBUG → ¿newPaginacionContainer encontrado?", !!newPaginacionContainer);

        if (newProductosContainer && productosContainer) {
            productosContainer.innerHTML = newProductosContainer.innerHTML;
        }
        if (newPaginacionContainer && paginacionContainer) {
            paginacionContainer.innerHTML = newPaginacionContainer.innerHTML;
        }

        setupPaginationListeners();
        if (typeof initProductAnimations === 'function') {
            initProductAnimations();
        }

    } catch (error) {
        console.error("DEBUG → Error en fetch:", error);
    } finally {
        hideLoading();
    }
}

    }
    
    // Llama a la función al inicio para que los enlaces de la primera página funcionen
    setupPaginationListeners();
});

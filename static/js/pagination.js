// =====================================================================
// Script de paginación asíncrona optimizado
// Este script maneja la carga de productos sin recargar la página completa.
// =====================================================================

document.addEventListener('DOMContentLoaded', function() {

    // Referencias a los contenedores principales del DOM
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
            productosContainer.style.opacity = '0.5';
            productosContainer.style.pointerEvents = 'none';
        }
    }

    /**
     * Oculta el spinner de carga.
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
     * Asigna los eventos de clic a los nuevos enlaces de paginación.
     */
    function setupPaginationListeners() {
        if (!paginacionContainer) return;

        const paginationLinks = paginacionContainer.querySelectorAll('a[href]');

        paginationLinks.forEach(link => {
            // Elimina escuchadores anteriores para evitar duplicados
            link.removeEventListener('click', handlePaginationClick);
            // Adjunta el nuevo escuchador
            link.addEventListener('click', handlePaginationClick);
        });
    }

    /**
     * Maneja el evento de clic en un enlace de paginación.
     * @param {Event} e - El objeto del evento de clic.
     */
    async function handlePaginationClick(e) {
        e.preventDefault(); // Previene la recarga normal de la página

        const href = this.getAttribute('href');
        // Resuelve la URL relativa a una URL completa
        const url = new URL(href, window.location.href).toString();

        console.log("DEBUG → Clic en enlace:", href);
        console.log("DEBUG → URL resuelta para fetch:", url);

        showLoading();

        try {
            const response = await fetch(url);
            console.log("DEBUG → Estado de la respuesta:", response.status);

            if (!response.ok) {
                throw new Error('La respuesta de la red no fue exitosa');
            }

            const html = await response.text();

            // Parsea el HTML recibido en un documento temporal
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');

            const newProductosContainer = doc.getElementById('productos-grid');
            const newPaginacionContainer = doc.getElementById('pagination-container');

            console.log("DEBUG → ¿Contenedor de productos encontrado en respuesta?", !!newProductosContainer);
            console.log("DEBUG → ¿Contenedor de paginación encontrado en respuesta?", !!newPaginacionContainer);

            // Reemplaza el contenido de los productos si se encontró
            if (newProductosContainer && productosContainer) {
                productosContainer.innerHTML = newProductosContainer.innerHTML;
            }

            // Reemplaza los controles de paginación si se encontraron
            if (newPaginacionContainer && paginacionContainer) {
                paginacionContainer.innerHTML = newPaginacionContainer.innerHTML;
            }

            // Vuelve a asignar los eventos a los nuevos enlaces de paginación
            setupPaginationListeners();
            
            // Llama a la función de animaciones si existe
            if (typeof initProductAnimations === 'function') {
                initProductAnimations();
            }

        } catch (error) {
            console.error("DEBUG → Error durante el fetch:", error);
        } finally {
            hideLoading();
        }
    }

    // Llama a la función al inicio para que los enlaces de la primera página funcionen
    setupPaginationListeners();
});
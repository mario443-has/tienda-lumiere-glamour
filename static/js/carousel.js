// Espera a que el DOM esté completamente cargado antes de ejecutar el script.
document.addEventListener('DOMContentLoaded', function () {

    // =================================================================
    // Lógica para el Carrusel de Anuncios
    // =================================================================
    const announcementCarousel = document.getElementById('announcement-carousel');
    const prevAnnounce = document.getElementById('prev-announcement');
    const nextAnnounce = document.getElementById('next-announcement');
    const announceIndicators = document.querySelectorAll('#carousel-indicators .indicator');
    let currentAnnounce = 0;

    // Función para actualizar la posición y los indicadores del carrusel de anuncios.
    function updateAnnounceCarousel(index) {
        if (!announcementCarousel || !announceIndicators[index]) return;
        const itemWidth = announcementCarousel.querySelector('.carousel-item').clientWidth;
        announcementCarousel.scrollLeft = itemWidth * index;
        announceIndicators.forEach(indicator => indicator.classList.remove('opacity-100'));
        announceIndicators[index].classList.add('opacity-100');
    }

    if (announcementCarousel) {
        // Event listeners para los botones de navegación.
        prevAnnounce.addEventListener('click', () => {
            currentAnnounce = (currentAnnounce - 1 + announceIndicators.length) % announceIndicators.length;
            updateAnnounceCarousel(currentAnnounce);
        });

        nextAnnounce.addEventListener('click', () => {
            currentAnnounce = (currentAnnounce + 1) % announceIndicators.length;
            updateAnnounceCarousel(currentAnnounce);
        });

        // Event listeners para los indicadores de posición.
        announceIndicators.forEach((indicator, index) => {
            indicator.addEventListener('click', () => {
                currentAnnounce = index;
                updateAnnounceCarousel(currentAnnounce);
            });
        });

        // Bucle automático con temporizador.
        let announceInterval = setInterval(() => {
            nextAnnounce.click();
        }, 5000);

        // Pausa el carrusel al pasar el mouse por encima.
        announcementCarousel.addEventListener('mouseenter', () => clearInterval(announceInterval));
        announcementCarousel.addEventListener('mouseleave', () => {
            announceInterval = setInterval(() => {
                nextAnnounce.click();
            }, 5000);
        });
    }

    // =================================================================
    // Lógica para el Carrusel de Categorías (solo para móvil)
    // =================================================================
    const categoryCarousel = document.getElementById('category-carousel');
    const prevCategory = document.getElementById('prev-category');
    const nextCategory = document.getElementById('next-category');
    const categoryIndicators = document.querySelectorAll('#category-carousel-indicators .indicator');
    let currentCategory = 0;
    
    // Función para actualizar la posición y los indicadores del carrusel de categorías.
    function updateCategoryCarousel(index) {
        if (!categoryCarousel) return;
        const itemWidth = categoryCarousel.querySelector('.carousel-item').clientWidth;
        categoryCarousel.scrollLeft = itemWidth * index;
        categoryIndicators.forEach(indicator => indicator.classList.remove('opacity-100'));
        if (categoryIndicators[index]) {
            categoryIndicators[index].classList.add('opacity-100');
        }
    }

    if (categoryCarousel) {
        // Event listeners para los botones de navegación.
        prevCategory.addEventListener('click', () => {
            currentCategory = (currentCategory - 1 + categoryIndicators.length) % categoryIndicators.length;
            updateCategoryCarousel(currentCategory);
        });
        
        nextCategory.addEventListener('click', () => {
            currentCategory = (currentCategory + 1) % categoryIndicators.length;
            updateCategoryCarousel(currentCategory);
        });

        // Event listeners para los indicadores de posición.
        categoryIndicators.forEach((indicator, index) => {
            indicator.addEventListener('click', () => {
                currentCategory = index;
                updateCategoryCarousel(currentCategory);
            });
        });

        // Inicializa el carrusel de categorías.
        updateCategoryCarousel(currentCategory);
    }
});
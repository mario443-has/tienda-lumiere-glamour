document.addEventListener('DOMContentLoaded', function () {
    // ============================================================================
    // 🖼 Carrusel de Anuncios (INFINITO: clones + swipe + resize + auto + indicadores)
    // ============================================================================
    const carousel = document.getElementById('announcement-carousel');
    const carouselWrapper = document.getElementById('announcement-carousel-wrapper');
    const prevBtn = document.getElementById('prev-announcement');
    const nextBtn = document.getElementById('next-announcement');
    const indicators = document.querySelectorAll('#carousel-indicators .indicator');

    let currentIndex = 1; // Comenzamos en 1 por el primer clon
    let autoSlideInterval;
    const autoSlideDelay = 5000;
    let isTransitioning = false;

    let items = [];

    function cloneSlides() {
        const originalSlides = [...carousel.querySelectorAll('.carousel-item')];
        if (originalSlides.length === 0) return;

        const firstClone = originalSlides[0].cloneNode(true);
        const lastClone = originalSlides[originalSlides.length - 1].cloneNode(true);

        firstClone.classList.add('clone');
        lastClone.classList.add('clone');

        carousel.appendChild(firstClone);
        carousel.insertBefore(lastClone, originalSlides[0]);

        items = [...carousel.querySelectorAll('.carousel-item')];
    }

    function updateCarousel(index, animate = true) {
        if (!carousel || items.length === 0) return;
        const itemWidth = items[0].clientWidth;
        if (!animate) {
            carousel.style.transition = 'none';
        } else {
            carousel.style.transition = 'transform 0.4s ease';
        }
        carousel.style.transform = `translateX(${-itemWidth * index}px)`;

        // Actualizar indicadores (sin contar clones)
        indicators.forEach(ind => ind.classList.remove('opacity-100'));
        const realIndex = (index - 1 + indicators.length) % indicators.length;
        if (indicators[realIndex]) {
            indicators[realIndex].classList.add('opacity-100');
        }
    }

    function goToSlide(index) {
        if (isTransitioning) return;
        isTransitioning = true;
        currentIndex = index;
        updateCarousel(currentIndex, true);
    }

    function startAutoSlide() {
        stopAutoSlide();
        autoSlideInterval = setInterval(() => {
            goToSlide(currentIndex + 1);
        }, autoSlideDelay);
    }

    function stopAutoSlide() {
        clearInterval(autoSlideInterval);
    }

    function handleTransitionEnd() {
        const itemWidth = items[0].clientWidth;
        if (items[currentIndex].classList.contains('clone')) {
            carousel.style.transition = 'none';
            if (currentIndex === 0) {
                currentIndex = items.length - 2;
            } else if (currentIndex === items.length - 1) {
                currentIndex = 1;
            }
            carousel.style.transform = `translateX(${-itemWidth * currentIndex}px)`;
        }
        isTransitioning = false;
    }

    if (carousel && carouselWrapper && indicators.length > 0) {
        cloneSlides();

        carousel.addEventListener('transitionend', handleTransitionEnd);

        prevBtn?.addEventListener('click', () => {
            goToSlide(currentIndex - 1);
        });

        nextBtn?.addEventListener('click', () => {
            goToSlide(currentIndex + 1);
        });

        indicators.forEach((dot, i) => {
            dot.addEventListener('click', () => {
                goToSlide(i + 1); // +1 por el primer clon
            });
        });

        carousel.addEventListener('mouseenter', stopAutoSlide);
        carousel.addEventListener('mouseleave', startAutoSlide);

        // Swipe (móvil)
        let startX = 0;
        let isDragging = false;
        const dragThreshold = 50;

        carouselWrapper.addEventListener('touchstart', (e) => {
            startX = e.touches[0].clientX;
            isDragging = true;
            stopAutoSlide();
        }, { passive: true });

        carouselWrapper.addEventListener('touchmove', (e) => {
            if (!isDragging) return;
            const currentX = e.touches[0].clientX;
            const diffX = currentX - startX;

            if (Math.abs(diffX) > dragThreshold) {
                if (diffX < 0) {
                    goToSlide(currentIndex + 1);
                } else {
                    goToSlide(currentIndex - 1);
                }
                isDragging = false;
            }
        }, { passive: true });

        carouselWrapper.addEventListener('touchend', () => {
            isDragging = false;
            startAutoSlide();
        });

        carouselWrapper.addEventListener('touchcancel', () => {
            isDragging = false;
            startAutoSlide();
        });

        // Resize
        const resizeObserver = new ResizeObserver(() => {
            updateCarousel(currentIndex, false);
        });
        resizeObserver.observe(carouselWrapper);

        // Inicializar
        updateCarousel(currentIndex, false);
        startAutoSlide();
    }

    // ============================================================================
    // 🌀 Carrusel de Categorías (móvil) - SIN CAMBIOS
    // ============================================================================
    const categoryCarousel = document.getElementById('category-carousel');
    const prevCategory = document.getElementById('prev-category');
    const nextCategory = document.getElementById('next-category');
    const categoryIndicators = document.querySelectorAll('#category-carousel-indicators .indicator');
    let currentCategory = 0;

    function updateCategoryCarousel(index) {
        if (!categoryCarousel) return;
        const itemWidth = categoryCarousel.querySelector('.carousel-item').clientWidth;
        categoryCarousel.scrollLeft = itemWidth * index;
        categoryIndicators.forEach(ind => ind.classList.remove('opacity-100'));
        if (categoryIndicators[index]) {
            categoryIndicators[index].classList.add('opacity-100');
        }
    }

    if (categoryCarousel) {
        prevCategory?.addEventListener('click', () => {
            currentCategory = (currentCategory - 1 + categoryIndicators.length) % categoryIndicators.length;
            updateCategoryCarousel(currentCategory);
        });

        nextCategory?.addEventListener('click', () => {
            currentCategory = (currentCategory + 1) % categoryIndicators.length;
            updateCategoryCarousel(currentCategory);
        });

        categoryIndicators.forEach((indicator, index) => {
            indicator.addEventListener('click', () => {
                currentCategory = index;
                updateCategoryCarousel(currentCategory);
            });
        });

        updateCategoryCarousel(currentCategory);
    }
});

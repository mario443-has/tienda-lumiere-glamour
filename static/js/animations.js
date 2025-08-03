function initProductAnimations() {
    // =========================================================================
    // Animación de aparición de tarjetas al hacer scroll (Intersection Observer)
    // =========================================================================
    const productCards = document.querySelectorAll('.product-card');

    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.1
    };

    const observerCallback = (entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
                observer.unobserve(entry.target);
            }
        });
    };

    const observer = new IntersectionObserver(observerCallback, observerOptions);
    productCards.forEach(card => observer.observe(card));

    // =========================================================================
    // Efecto 3D de inclinación en las tarjetas de producto (mousemove)
    // =========================================================================
    productCards.forEach(container => {
        const tilt = container.querySelector('.product-tilt-container');
        if (!tilt) return;

        container.addEventListener('mousemove', (e) => {
            const rect = container.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            const rotateX = ((centerY - y) / centerY) * 10;
            const rotateY = ((x - centerX) / centerX) * 10;
            tilt.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.05)`;
        });

        container.addEventListener('mouseleave', () => {
            tilt.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale(1.0)';
        });
    });
}

// Ejecutar animaciones al cargar la página por primera vez
document.addEventListener("DOMContentLoaded", () => {
    initProductAnimations();
});

// Espera a que el DOM esté completamente cargado antes de ejecutar el script
document.addEventListener("DOMContentLoaded", () => {
    
    // =========================================================================
    // Animación de aparición de tarjetas al hacer scroll (Intersection Observer)
    // =========================================================================
    const productCards = document.querySelectorAll('.product-card');

    // Opciones para el IntersectionObserver
    const observerOptions = {
        root: null, // Observa respecto al viewport
        rootMargin: '0px',
        threshold: 0.1 // 10% de la tarjeta debe ser visible para activarse
    };

    // Callback que se ejecuta cuando un elemento entra en el viewport
    const observerCallback = (entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                // Si el elemento es visible, añade la clase 'is-visible'
                entry.target.classList.add('is-visible');
                // Deja de observar el elemento una vez que ha aparecido
                observer.unobserve(entry.target);
            }
        });
    };

    // Crea y configura el nuevo IntersectionObserver
    const observer = new IntersectionObserver(observerCallback, observerOptions);

    // Observa cada tarjeta de producto
    productCards.forEach(card => {
        observer.observe(card);
    });

    // =========================================================================
    // Efecto 3D de inclinación en las tarjetas de producto (mousemove)
    // =========================================================================
    const tiltContainers = document.querySelectorAll('.product-card');

    tiltContainers.forEach(container => {
        // Evento que se dispara cuando el cursor se mueve sobre la tarjeta
        container.addEventListener('mousemove', (e) => {
            // Obtiene las dimensiones y posición de la tarjeta
            const rect = container.getBoundingClientRect();
            // Calcula la posición del cursor dentro de la tarjeta
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            // Calcula el centro de la tarjeta
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;

            // Calcula el ángulo de rotación basado en la posición del cursor
            // Máxima rotación de 10 grados en ambos ejes
            const rotateX = ((centerY - y) / centerY) * 10;
            const rotateY = ((x - centerX) / centerX) * 10;

            // Aplica la transformación 3D al contenedor de la imagen
            container.querySelector('.product-tilt-container').style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.05)`;
        });

        // Evento que se dispara cuando el cursor sale de la tarjeta
        container.addEventListener('mouseleave', () => {
            // Resetea la transformación 3D a su estado original
            container.querySelector('.product-tilt-container').style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale(1.0)';
        });
    });
});

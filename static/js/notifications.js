// Función para mostrar notificaciones modales
function showNotification({ type = 'success', title, message, duration = 3000 }) {
    // Crear el contenedor principal
    const modal = document.createElement('div');
    modal.className = `modal-notification modal-${type}`;

    // Crear el contenido de la modal
    const content = document.createElement('div');
    content.className = 'modal-content';

    // Agregar el icono según el tipo
    const icon = document.createElement('div');
    icon.className = 'modal-icon';
    icon.innerHTML = getIconForType(type);
    content.appendChild(icon);

    // Contenedor del texto
    const textContent = document.createElement('div');
    textContent.className = 'modal-text';

    // Título
    const titleElement = document.createElement('div');
    titleElement.className = 'modal-title';
    titleElement.textContent = title;
    textContent.appendChild(titleElement);

    // Mensaje
    if (message) {
        const messageElement = document.createElement('div');
        messageElement.className = 'modal-message';
        messageElement.textContent = message;
        textContent.appendChild(messageElement);
    }

    content.appendChild(textContent);
    modal.appendChild(content);

    // Agregar botón de cerrar
    const closeButton = document.createElement('button');
    closeButton.className = 'modal-close';
    closeButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" width="16" height="16">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
    </svg>`;
    modal.appendChild(closeButton);

    // Agregar barra de progreso
    const progress = document.createElement('div');
    progress.className = 'modal-progress';
    const progressBar = document.createElement('div');
    progressBar.className = 'modal-progress-bar';
    progress.appendChild(progressBar);
    modal.appendChild(progress);

    // Agregar al DOM
    document.body.appendChild(modal);

    // Activar la animación de entrada
    requestAnimationFrame(() => {
        modal.classList.add('show');
    });

    // Manejar el cierre
    const close = () => {
        modal.classList.remove('show');
        setTimeout(() => {
            document.body.removeChild(modal);
        }, 500);
    };

    // Cerrar al hacer clic en el botón
    closeButton.addEventListener('click', close);

    // Cerrar automáticamente después del tiempo especificado
    if (duration) {
        setTimeout(close, duration);
    }
}

// Función auxiliar para obtener el icono según el tipo
function getIconForType(type) {
    switch (type) {
        case 'success':
            return `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="#059669" width="24" height="24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>`;
        case 'error':
            return `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="#dc2626" width="24" height="24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>`;
        case 'info':
            return `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="#3b82f6" width="24" height="24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>`;
    }
}

// Ejemplo de uso:
function showSuccessNotification(message, title = 'Éxito') {
    showNotification({
        type: 'success',
        title: title,
        message: message
    });
}

function showErrorNotification(message, title = 'Error') {
    showNotification({
        type: 'error',
        title: title,
        message: message
    });
}

function showInfoNotification(message, title = 'Información') {
    showNotification({
        type: 'info',
        title: title,
        message: message
    });
}

// Reemplazar las alertas existentes
function updateCart(message) {
    showSuccessNotification(message, 'Carrito Actualizado');
}

function addToFavorites(message) {
    showSuccessNotification(message, 'Favoritos');
}

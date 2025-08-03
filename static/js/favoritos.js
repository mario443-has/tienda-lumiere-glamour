// favoritos.js

// =========================================================================
// 🔄 Funciones auxiliares
// =========================================================================

// Obtener cookie CSRF
function getCookie(name) {
  let cookieValue = null;
  if (document.cookie && document.cookie !== "") {
    const cookies = document.cookie.split(";");
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i].trim();
      // Coincidir el nombre exacto
      if (cookie.startsWith(name + "=")) {
        cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
        break;
      }
    }
  }
  return cookieValue;
}

// =========================================================================
// 🎨 Lógica visual y animaciones
// =========================================================================

/**
 * Aplica el estado visual (marcado o no) a todos los botones de favorito de un producto.
 * @param {string} productoId - ID del producto.
 * @param {boolean} isFavorito - True si es favorito, false en caso contrario.
 */
function applyFavoriteState(productoId, isFavorito) {
  const botones = document.querySelectorAll(`.btn-favorito[data-product-id="${productoId}"]`);
  botones.forEach(btn => {
    const icon = btn.querySelector("i");
    if (!icon) return;
    if (isFavorito) {
      icon.classList.remove("far", "text-gray-500", "group-hover:text-pink-500");
      icon.classList.add("fas", "text-red-500");
    } else {
      icon.classList.remove("fas", "text-red-500");
      icon.classList.add("far", "text-gray-500", "group-hover:text-pink-500");
    }
  });
}

/**
 * Añade una animación de rebote al ícono de corazón.
 * Requiere que la clase 'animate-bounce' esté definida en el CSS.
 * @param {HTMLElement} icon - El elemento <i> del ícono.
 */
function addBounceAnimation(icon) {
  if (icon) {
    icon.classList.add("animate-bounce");
    setTimeout(() => {
      icon.classList.remove("animate-bounce");
    }, 500); // Duración de la animación en ms
  }
}

// =========================================================================
// ⚙️ Lógica principal de interacción
// =========================================================================

/**
 * Alterna el estado de favorito de un producto.
 * Se llama desde el evento de clic.
 * @param {HTMLElement} button - El botón de favorito clicado.
 * @param {string} productoId - ID del producto.
 */
window.toggleFavorito = function (button, productoId) {
  if (button.classList.contains("animate")) return; // Previene clics múltiples
  button.classList.add("animate");
  
  const csrftoken = getCookie("csrftoken");
  const isCurrentlyFavorite = localStorage.getItem(`favorito-${productoId}`) === "true";
  const newFavoriteState = !isCurrentlyFavorite;

  fetch("/toggle-favorito/", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-CSRFToken": csrftoken,
    },
    body: JSON.stringify({ producto_id: productoId }),
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.success) {
        // Actualiza el estado visual en todos los íconos
        applyFavoriteState(productoId, newFavoriteState);

        // Actualiza el estado en localStorage
        localStorage.setItem(`favorito-${productoId}`, newFavoriteState);
        
        // Muestra una notificación si la función existe
        if (typeof showFavoriteMessage === "function") {
          showFavoriteMessage(data.message);
        }

        // Añade la animación visual al ícono del botón que se hizo clic
        const icon = button.querySelector("i");
        addBounceAnimation(icon);

      } else {
        // Muestra un mensaje de error si la función existe
        if (typeof showErrorNotification === "function") {
            showErrorNotification(data.message || "No se pudo actualizar el estado de favoritos. Intenta de nuevo.");
        }
        console.error("Error del servidor:", data.message);
      }
    })
    .catch((error) => {
      console.error("Error al actualizar favoritos:", error);
      if (typeof showErrorNotification === "function") {
        showErrorNotification("Hubo un problema al actualizar los favoritos. Intenta de nuevo.");
      }
    })
    .finally(() => {
      setTimeout(() => {
        button.classList.remove("animate");
      }, 300); // Elimina la clase 'animate' después de un breve periodo
    });
};

/**
 * Lógica para el botón de "más colores" en las tarjetas de producto.
 * Muestra u oculta los colores adicionales.
 */
function setupMoreColorsButton() {
  document.querySelectorAll(".more-colors-button").forEach(button => {
    button.addEventListener("click", function (e) {
      // Detiene la propagación del evento para no activar el enlace padre.
      e.preventDefault(); 
      e.stopPropagation();

      const productId = this.dataset.productId;
      const additionalColorsContainer = document.getElementById(`additional-colors-${productId}`);
      if (additionalColorsContainer) {
        additionalColorsContainer.classList.toggle("hidden");
        // Puedes agregar una clase de transición para una animación suave si lo deseas
      }
    });
  });
}


// =========================================================================
// 🚀 Inicialización al cargar el DOM
// =========================================================================

/**
 * Función principal para inicializar la lógica de favoritos.
 */
function initFavoritos() {
  // Inicializar estado de favoritos desde localStorage para todos los botones
  document.querySelectorAll(".btn-favorito").forEach(button => {
    const productoId = button.dataset.productId;
    const isFavorito = localStorage.getItem(`favorito-${productoId}`) === "true";
    applyFavoriteState(productoId, isFavorito);
  });

  // 🔄 ¡Ahora sí se llama a esta función!
  setupMoreColorsButton(); 
}


// Manejar el evento de clic en los botones de favoritos usando delegación
document.addEventListener("click", event => {
  // Detecta el botón aunque se haga clic en el ícono
  let button = event.target.closest(".btn-favorito"); 
  if (button) {
    const productoId = button.dataset.productId;
    window.toggleFavorito(button, productoId);
  }
});

// Ejecutar la función de inicialización cuando el DOM esté listo
document.addEventListener("DOMContentLoaded", initFavoritos);

// favoritos.js

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

// Función para cambiar el estado visual de todos los íconos favoritos del mismo producto
function applyFavoriteState(productoId, isFavorito) {
  const botones = document.querySelectorAll(`.btn-favorito[data-id="${productoId}"]`);
  botones.forEach(btn => {
    const icon = btn.querySelector("i");
    if (!icon) return;
    if (isFavorito) {
      icon.classList.remove("far", "text-gray-500");
      icon.classList.add("fas", "text-red-500");
    } else {
      icon.classList.remove("fas", "text-red-500");
      icon.classList.add("far", "text-gray-500");
    }
  });
}

// Función global llamada por onclick en HTML
window.toggleFavorito = function (button, productoId) {
  console.log(`toggleFavorito llamado para productoId: ${productoId}`);
  button.classList.add("animate");

  fetch("/toggle-favorito/", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-CSRFToken": getCookie("csrftoken"),
    },
    body: JSON.stringify({ producto_id: productoId }),
  })
    .then(response => {
      if (!response.ok) {
        console.error(`HTTP Error: ${response.status}`);
        return response.json().then(err => {
          throw new Error(err.error || "Error desconocido del servidor");
        }).catch(() => {
          throw new Error(`Servidor respondió con ${response.status}`);
        });
      }
      return response.json();
    })
    .then(data => {
      console.log(`Respuesta del servidor para productoId ${productoId}:`, data);
      if (data.is_favorito) {
        localStorage.setItem(`favorito-${productoId}`, "true");
      } else {
        localStorage.removeItem(`favorito-${productoId}`);
      }
      applyFavoriteState(productoId, data.is_favorito);

      if (!data.is_favorito && window.location.pathname === "/favoritos/") {
        const card = button.closest(".col, .product-card");
        if (card) {
          card.style.transition = "opacity 0.3s";
          card.style.opacity = "0";
          setTimeout(() => {
            card.remove();
            if (document.querySelectorAll(".col, .product-card").length === 0) {
              location.reload();
            }
          }, 300);
        }
      }
    })
    .catch(error => {
      console.error("Error al actualizar favoritos:", error);
      alert("❌ Hubo un problema al actualizar los favoritos. Intenta de nuevo.");
    })
    .finally(() => {
      setTimeout(() => {
        button.classList.remove("animate");
      }, 300);
    });
};
// Inicializar estado de favoritos desde localStorage
document.addEventListener("DOMContentLoaded", () => {    
  document.querySelectorAll(".btn-favorito").forEach(button => {
    const productoId = button.dataset.id;
    const isFavorito = localStorage.getItem(`favorito-${productoId}`) === "true";
    applyFavoriteState(productoId, isFavorito);
  });  
  setupMoreColorsButton();         
})
// Manejar el evento de clic en los botones de favoritos
document.addEventListener("click", event => {            
  let button = event.target.closest(".btn-favorito"); // Detecta el botón aunque se haga clic en el ícono
  if (button) {
    const productoId = button.dataset.id;
    toggleFavorito(button, productoId);
  }
});                
// Lógica para el botón de "más colores"
function setupMoreColorsButton() {
  document.querySelectorAll(".more-colors-button").forEach(button => {
    button.addEventListener("click", function () {
      const productId = this.dataset.productId;
      const additionalColorsContainer = document.getElementById(`additional-colors-${productId}`);
      if (additionalColorsContainer) {
        additionalColorsContainer.classList.toggle("hidden");
        additionalColorsContainer.classList.toggle("visible");
      }
    });
  });
}
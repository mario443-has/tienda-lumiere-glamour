// Mostrar el modal con un título y mensaje personalizado
function showMessageModal(titulo = "Mensaje", mensaje = "") {
  const modal = document.getElementById("custom-modal");
  const titleElem = document.getElementById("modal-title");
  const messageElem = document.getElementById("modal-message");

  titleElem.textContent = titulo;
  messageElem.textContent = mensaje;

  modal.classList.remove("hidden");
}

// Cerrar el modal
document.addEventListener("DOMContentLoaded", () => {
  const modal = document.getElementById("custom-modal");
  const closeBtn = document.getElementById("modal-close-btn");

  closeBtn.addEventListener("click", () => {
    modal.classList.add("hidden");
  });

  // También cerrar si hace clic fuera del contenido
  modal.addEventListener("click", (e) => {
    if (e.target === modal) {
      modal.classList.add("hidden");
    }
  });
});

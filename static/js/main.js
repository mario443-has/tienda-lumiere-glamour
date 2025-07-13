// =====================================================================
// Funciones y variables globales (accesibles desde cualquier parte)
// =====================================================================

// ✅ Cargar el carrito desde localStorage cuando se inicia
function cargarCarritoLocal() {
  const carritoGuardado = localStorage.getItem('carritoLumiere');
  if (carritoGuardado) {
    window.cart = JSON.parse(carritoGuardado);
    // Asegurarse de que la cantidad sea un número válido para cada ítem
    window.cart.forEach(item => {
        item.quantity = (typeof item.quantity === 'number' && !isNaN(item.quantity)) ? item.quantity : 1;
        item.price = parseFloat(item.price) || 0; // Asegurar que el precio sea un número
        // Asegurar que imageUrl siempre sea una cadena válida, usando el placeholder si es necesario
        item.imageUrl = item.imageUrl || window.placeholderImageUrl || '/static/img/sin_imagen.jpg';
    });
  } else {
    window.cart = [];
  }
}

// ✅ Guardar el carrito en localStorage después de modificarlo
function guardarCarritoLocal() {
  localStorage.setItem('carritoLumiere', JSON.stringify(window.cart));
}

// ✅ Llamar esta función apenas cargue la página
cargarCarritoLocal();


function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== "") {
        const cookies = document.cookie.split(";");
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === name + "=") {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
            }
        }
    return cookieValue;
}

// Las funciones showMessageModal y closeMessageModal ya son globales
function showMessageModal(title, message) {
    document.getElementById('message-modal-title').innerText = title;
    document.getElementById('message-modal-content').innerText = message;
    document.getElementById('message-modal').classList.remove('hidden');
}

function closeMessageModal() {
    document.getElementById('message-modal').classList.add('hidden');
}

// --- Funciones del Carrito (ahora globales para acceso desde HTML) ---

// Referencias a elementos del DOM para las funciones globales del carrito
// Estas se inicializarán en DOMContentLoaded
let cartModal;
let cartItemsContainer;
let emptyCartMessage;
let cartTotalSpan;
let buyWhatsappButton;
let buyWhatsappCartCountSpan;
let modalBuyWhatsappButton;
let cartCountElement; // Contador superior
let mobileCartCountElement; // Contador móvil

function openCartModal() {
    // Asegurarse de que las referencias a los elementos del DOM estén inicializadas
    if (!cartModal) initializeCartDomElements();
    if (cartModal) {
        cartModal.classList.remove("hidden");
        renderCartItems(); // Asegura que los ítems se rendericen al abrir
    }
}

function closeCartModal() {
    if (cartModal) {
        cartModal.classList.add("hidden");
    }
}

function actualizarContadorCarrito() {
    // Asegurarse de que las referencias a los elementos del DOM estén inicializadas
    if (!cartCountElement) initializeCartDomElements();

    let totalItemsInCart = 0;
    window.cart.forEach(item => {
        // Asegura que item.quantity sea un número, por defecto 1 si es inválido
        totalItemsInCart += (typeof item.quantity === 'number' && !isNaN(item.quantity)) ? item.quantity : 1;
    });

    if (cartCountElement) {
        cartCountElement.innerText = totalItemsInCart;
        cartCountElement.classList.toggle("hidden", totalItemsInCart === 0);
    }
    if (mobileCartCountElement) {
        mobileCartCountElement.innerText = totalItemsInCart;
        mobileCartCountElement.classList.toggle("hidden", totalItemsInCart === 0);
    }
    if (buyWhatsappButton && buyWhatsappCartCountSpan) {
        buyWhatsappCartCountSpan.textContent = totalItemsInCart;
        buyWhatsappButton.classList.toggle("hidden", totalItemsInCart === 0);
    }
}

function renderCartItems() {
    // Asegurarse de que las referencias a los elementos del DOM estén inicializadas
    if (!cartItemsContainer) initializeCartDomElements();

    if (cartItemsContainer) {
        cartItemsContainer.innerHTML = ""; // Limpiar el contenedor actual
    }
    let total = 0;

    if (window.cart.length === 0) {
        if (emptyCartMessage) emptyCartMessage.classList.remove("hidden");
    } else {
        if (emptyCartMessage) emptyCartMessage.classList.add("hidden");
        window.cart.forEach((item, index) => {
            // Asegurar que price y quantity sean números para el cálculo y la visualización
            const itemPrice = parseFloat(item.price) || 0; // Por defecto 0 si el parseo falla
            const itemQuantity = (typeof item.quantity === 'number' && !isNaN(item.quantity)) ? item.quantity : 1; // Por defecto 1 si es inválido

            // Asegurar que item.imageUrl sea una cadena válida
            const imageUrlToDisplay = item.imageUrl || window.placeholderImageUrl || '/static/img/sin_imagen.jpg';

            const itemDiv = document.createElement("div");
            itemDiv.classList.add(
                "flex",
                "items-center",
                "py-2",
                "border-b",
                "border-gray-100",
                "gap-4" // Espacio entre los elementos del ítem
            );
            itemDiv.innerHTML = `
                        <img src="${imageUrlToDisplay}" alt="${item.name}" class="w-16 h-16 object-cover rounded-md shadow-sm" onerror="this.onerror=null;this.src='${window.placeholderImageUrl || '/static/img/sin_imagen.jpg'}';">
                        <div class="flex-1">
                            <p class="text-gray-800 font-medium">${item.name}</p>
                            ${item.color && item.color !== 'N/A' ? `<p class="text-gray-500 text-xs">Color: ${item.color}</p>` : ''}
                            <p class="text-gray-600 text-sm">$${itemPrice.toFixed(2)} x ${itemQuantity}</p>
                        </div>
                        <div class="flex items-center space-x-2">
                            <button class="text-gray-500 hover:text-pink-600" onclick="updateItemQuantity('${item.variantId}', -1)">
                                <i class="fas fa-minus-circle"></i>
                            </button>
                            <span class="font-semibold">${itemQuantity}</span>
                            <button class="text-gray-500 hover:text-pink-600" onclick="updateItemQuantity('${item.variantId}', 1)">
                                <i class="fas fa-plus-circle"></i>
                            </button>
                            <button class="text-red-500 hover:text-red-700 ml-2" onclick="updateItemQuantity('${item.variantId}', 0)">
                                <i class="fas fa-trash-alt"></i>
                            </button>
                        </div>
                    `;
            if (cartItemsContainer) cartItemsContainer.appendChild(itemDiv);
            total += itemPrice * itemQuantity;
        });
    }
    if (cartTotalSpan) cartTotalSpan.textContent = `$${total.toFixed(2)}`;
}

// Nueva función para actualizar la cantidad de un ítem en el carrito
function updateItemQuantity(variantIdToUpdate, change) {
    const itemIndex = window.cart.findIndex(item => item.variantId === variantIdToUpdate);

    if (itemIndex > -1) {
        // Asegurar que la cantidad existente sea un número antes de sumar
        window.cart[itemIndex].quantity = (typeof window.cart[itemIndex].quantity === 'number' && !isNaN(window.cart[itemIndex].quantity)) ? window.cart[itemIndex].quantity : 0;

        if (change === 0) { // Eliminar el ítem completamente
            window.cart.splice(itemIndex, 1);
            showMessageModal('Producto Eliminado', 'Producto eliminado del carrito.');
        } else {
            window.cart[itemIndex].quantity += change;
            if (window.cart[itemIndex].quantity <= 0) {
                window.cart.splice(itemIndex, 1); // Eliminar si la cantidad llega a 0 o menos
                showMessageModal('Producto Eliminado', 'Producto eliminado del carrito.');
            } else {
                showMessageModal('Cantidad Actualizada', `Cantidad de ${window.cart[itemIndex].name} actualizada a ${window.cart[itemIndex].quantity}.`);
            }
        }
        guardarCarritoLocal(); // Guardar cambios en localStorage
        updateCartDisplay(); // Re-renderizar el carrito y actualizar contadores
    }
}


function sendCartToWhatsApp() {
    if (window.cart.length === 0) {
        showMessageModal('Carrito Vacío', 'Tu carrito está vacío. Agrega productos antes de comprar.');
        return;
    }

    // Usar la variable global window.whatsappNumber
    const whatsappNumber = window.whatsappNumber || '573007221200';
    let message =
        "¡Hola! Me gustaría comprar los siguientes productos de mi carrito:\n\n";
    let total = 0;

    window.cart.forEach((item, index) => {
        const itemPrice = parseFloat(item.price) || 0;
        const itemQuantity = (typeof item.quantity === 'number' && !isNaN(item.quantity)) ? item.quantity : 1;

        message += `${index + 1}. ${item.name}`;
        if (item.color && item.color !== 'N/A') {
            message += ` (Color: ${item.color})`;
        }
        message += ` - Cantidad: ${itemQuantity} - $${(itemPrice * itemQuantity).toFixed(2)}\n`;
        total += itemPrice * itemQuantity;
    });

    message += `\nTotal estimado: $${total.toFixed(2)}\n`;
    message +=
        "Por favor, confírmame la disponibilidad y el proceso de pago.";

    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
        message
    )}`;
    window.open(whatsappUrl, "_blank");

    // Opcional: Limpiar el carrito después de enviar el pedido
    window.cart = [];
    guardarCarritoLocal(); // ✅ Guardar después de limpiar el carrito
    updateCartDisplay();
    showMessageModal('Pedido Enviado', 'Tu pedido ha sido enviado a WhatsApp. Revisa tu chat para continuar la compra.');
    closeCartModal();
}

function updateCartDisplay() {
    // Esta función ahora solo llama a renderCartItems y actualizarContadorCarrito
    // para asegurar que el modal y los contadores se actualicen.
    renderCartItems();
    actualizarContadorCarrito();
}

// --- Función para inicializar elementos del DOM cuando estén disponibles ---
function initializeCartDomElements() {
    cartModal = document.getElementById("cart-modal");
    cartItemsContainer = document.getElementById("cart-items-container");
    emptyCartMessage = document.getElementById("empty-cart-message");
    cartTotalSpan = document.getElementById("cart-total");
    buyWhatsappButton = document.getElementById("buy-whatsapp-button");
    buyWhatsappCartCountSpan = document.getElementById("buy-whatsapp-cart-count");
    modalBuyWhatsappButton = document.getElementById("modal-buy-whatsapp-button");
    cartCountElement = document.getElementById("cart-count");
    mobileCartCountElement = document.getElementById("mobile-cart-count");
}


// =====================================================================
// Lógica que se ejecuta cuando el DOM está completamente cargado
// =====================================================================
document.addEventListener("DOMContentLoaded", function () {
    // Inicializar elementos del DOM
    initializeCartDomElements();

    // JavaScript para el menú móvil (Hamburger)
    const mobileMenuButton = document.getElementById("mobile-menu-button");
    const mobileMenu = document.getElementById("mobile-menu");
    const mobileCategoriesButton = document.getElementById("mobile-categories-button");
    const mobileCategoriesDropdown = document.getElementById("mobile-categories-dropdown");
    const slider = document.getElementById("slider");
    const slideLeft = document.getElementById("slideLeft");
    const slideRight = document.getElementById("slideRight");
    const carouselWrapper = document.getElementById("announcement-carousel-wrapper");
    const carousel = document.getElementById("announcement-carousel");
    const items = carousel ? carousel.querySelectorAll(".carousel-item") : [];
    const prevBtn = document.getElementById("prev-announcement");
    const nextBtn = document.getElementById("next-announcement");
    const indicatorsContainer = document.getElementById("carousel-indicators");
    const indicators = indicatorsContainer ? indicatorsContainer.querySelectorAll(".indicator") : [];


    // Toggle del menú principal móvil
    if (mobileMenuButton) {
        mobileMenuButton.addEventListener("click", () => {
            if (mobileMenu) mobileMenu.classList.toggle("hidden");
            const icon = mobileMenuButton.querySelector("svg");
            if (icon) {
                if (mobileMenu && mobileMenu.classList.contains("hidden")) {
                    icon.innerHTML =
                        '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path>'; // Ícono de menú
                } else {
                    icon.innerHTML =
                        '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>'; // Ícono de cerrar
                }
            }
        });
    }

    // Toggle del dropdown de categorías en móvil
    if (mobileCategoriesButton) {
        mobileCategoriesButton.addEventListener("click", () => {
            if (mobileCategoriesDropdown) mobileCategoriesDropdown.classList.toggle("hidden");
            const icon = mobileCategoriesButton.querySelector("svg");
            if (icon) {
                icon.classList.toggle("rotate-0");
                icon.classList.toggle("rotate-180"); // Gira la flecha
            }
        });
    }

    // Toggle de submenús en móvil (para subcategorías)
    window.toggleSubmenu = function(button) { // Hacemos global para onclick en HTML
      const submenu = button.nextElementSibling; // El div que contiene las subcategorías
      if (submenu) {
        // Asegurarse de que el submenu exista
        submenu.classList.toggle("hidden");
        // Cambiar la flecha del botón del submenú
        const icon = button.querySelector("svg");
        if (icon) { // Asegurarse de que el ícono exista
            icon.classList.toggle("rotate-90"); // Flecha hacia abajo
            icon.classList.toggle("rotate-0"); // Flecha hacia la derecha
        }
      }
    }

    // Slider horizontal de productos
    if (slider) {
      if (slideLeft) {
        slideLeft.addEventListener("click", () => {
          slider.scrollLeft -= 300;
        });
      }
      if (slideRight) {
        slideRight.addEventListener("click", () => {
          slider.scrollLeft += 300;
        });
      }
    }

    // Lógica del Carrusel de Anuncios (Mejorada)
    let currentIndex = 0;
    let totalSlides = items.length;
    let autoSlideInterval;
    let dragThreshold = 50;

    function updateCarousel() {
        if (!carousel || totalSlides === 0) return;

        const offset = -currentIndex * 100;
        carousel.style.transform = `translateX(${offset}%)`;

        indicators.forEach((dot, i) => {
            dot.classList.toggle("opacity-100", i === currentIndex);
            dot.classList.toggle("opacity-50", i !== currentIndex);
        });
    }

    function goToSlide(index) {
        currentIndex = (index + totalSlides) % totalSlides;
        updateCarousel();
    }

    function startAutoSlide() {
        stopAutoSlide();
        if (totalSlides > 1) {
            autoSlideInterval = setInterval(() => {
                goToSlide(currentIndex + 1);
            }, 5000);
        }
    }

    function stopAutoSlide() {
        clearInterval(autoSlideInterval);
    }

    if (prevBtn) {
        prevBtn.addEventListener("click", () => {
            stopAutoSlide();
            goToSlide(currentIndex - 1);
            startAutoSlide();
        });
    }

    if (nextBtn) {
        nextBtn.addEventListener("click", () => {
            stopAutoSlide();
            goToSlide(currentIndex + 1);
            startAutoSlide();
        });
    }

    if (indicatorsContainer) {
        indicators.forEach((dot, i) => {
            dot.addEventListener("click", () => {
                stopAutoSlide();
                goToSlide(i);
                startAutoSlide();
            });
        });
    }

    let startX = 0;
    let isDragging = false;

    if (carouselWrapper) {
      carouselWrapper.addEventListener("touchstart", (e) => {
        startX = e.touches[0].clientX;
        isDragging = true;
        stopAutoSlide();
      });

      carouselWrapper.addEventListener("touchmove", (e) => {
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
          startX = currentX;
        }
      });

      carouselWrapper.addEventListener("touchend", () => {
        isDragging = false;
        startAutoSlide();
      });

      carouselWrapper.addEventListener("touchcancel", () => {
        isDragging = false;
        startAutoSlide();
      });
    }

    const resizeObserver = new ResizeObserver(() => {
      if (carouselWrapper && carousel) {
        updateCarousel();
      }
    });
    if (carouselWrapper) {
        resizeObserver.observe(carouselWrapper);
    }


    if (carousel && items.length > 0) {
      updateCarousel();
      startAutoSlide();
    }

    // Lógica de selección de color para variantes de producto
    document.querySelectorAll('.color-option').forEach(colorOption => {
        colorOption.addEventListener('click', function() {
            const parentProductDiv = this.closest('[data-product-id]'); // Encuentra el contenedor del producto
            const productId = parentProductDiv ? parentProductDiv.dataset.productId : null;

            const selectedVariantId = this.dataset.variantId;
            const selectedColorName = this.dataset.colorName;
            const selectedVariantImage = this.dataset.variantImage;
            const selectedVariantPrice = this.dataset.variantPrice;

            // Actualizar la imagen del producto
            const productImage = productId ? parentProductDiv.querySelector(`#product-image-${productId}`) : null;
            if (productImage) {
                productImage.src = selectedVariantImage;
            }

            // Actualizar el precio del producto
            const productPriceSpan = productId ? parentProductDiv.querySelector(`#product-price-${productId}`) : null;
            if (productPriceSpan) {
                productPriceSpan.textContent = `$${selectedVariantPrice}`;
            }

            // Remover la clase 'selected' de todas las opciones de color para este producto
            if (parentProductDiv) {
                parentProductDiv.querySelectorAll('.color-option').forEach(option => {
                    option.classList.remove('selected');
                });
            }


            // Añadir la clase 'selected' a la opción de color clickeada
            this.classList.add('selected');

            // Actualizar los data-attributes del botón "Agregar al Carrito"
            const addToCartButton = parentProductDiv ? parentProductDiv.querySelector('.btn-agregar-carrito') : null; // Usar la clase
            if (addToCartButton) {
                addToCartButton.dataset.selectedVariantId = selectedVariantId;
                addToCartButton.dataset.productPrice = selectedVariantPrice; // Actualiza el precio en el botón
                addToCartButton.dataset.selectedColor = selectedColorName; // Actualiza el color en el botón
                // Asegurarse de que la URL de la imagen también se actualice si la variante tiene una imagen diferente
                addToCartButton.dataset.productImageUrl = selectedVariantImage;
            }
        });
    });

    // Lógica para el botón de "más colores"
    document.querySelectorAll('.more-colors-button').forEach(button => {
        button.addEventListener('click', function() {
            const productId = this.dataset.productId;
            const additionalColorsContainer = document.getElementById(`additional-colors-${productId}`);
            if (additionalColorsContainer) {
                additionalColorsContainer.classList.toggle('hidden');
                additionalColorsContainer.classList.toggle('visible');
                // Opcional: Cambiar el texto del botón de '+' a '-' o un icono
                // this.innerHTML = additionalColorsContainer.classList.contains('visible') ? '<i class="fas fa-minus"></i>' : '<i class="fas fa-plus"></i>';
            }
        });
    });

    // Lógica para añadir al carrito (unificada para todos los botones .btn-agregar-carrito)
    const botonesAgregar = document.querySelectorAll(".btn-agregar-carrito");

    botonesAgregar.forEach(function (boton) {
        boton.addEventListener("click", function () {
            const productId = boton.getAttribute("data-product-id");
            const productName = boton.getAttribute("data-product-name");
            // Asegurar que productPrice sea un número
            const productPrice = parseFloat(boton.getAttribute("data-product-price")) || 0;
            const variantId = boton.getAttribute("data-selected-variant-id") || productId; // Usar productId como fallback
            const color = boton.getAttribute("data-selected-color") || 'N/A'; // Usar N/A como fallback
            // Usar window.placeholderImageUrl para el fallback
            const imageUrl = boton.getAttribute("data-product-image-url") || window.placeholderImageUrl; // Obtener URL de la imagen

            // Intentar obtener la cantidad del input si existe, de lo contrario, 1
            let quantity = 1;
            // Buscar el input de cantidad dentro del mismo contenedor de producto o el más cercano
            const parentContainer = boton.closest('.bg-white'); // Ajusta este selector si tu estructura es diferente
            if (parentContainer) {
                const quantityInput = parentContainer.querySelector("input[type='number']");
                if (quantityInput) {
                    quantity = parseInt(quantityInput.value);
                    if (isNaN(quantity) || quantity <= 0) { // Asegurar que la cantidad sea válida
                        quantity = 1;
                    }
                }
            }


            console.log("🛒 Añadiendo:", productId, "Cantidad:", quantity, "Variante:", variantId, "Color:", color, "Imagen:", imageUrl); // Depuración

            if (quantity > 0) {
                fetch("/agregar-al-carrito/", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "X-CSRFToken": getCookie("csrftoken"),
                    },
                    body: JSON.stringify({
                        producto_id: productId,
                        quantity: quantity,
                        variant_id: variantId,
                        color: color // Enviar el color al backend si es necesario
                    }),
                })
                .then((response) => response.json())
                .then((data) => {
                    if (data.mensaje) {
                        showMessageModal("✅ Producto añadido", "Producto: " + productName + " ha sido añadido al carrito.");
                        // Guardar en window.cart (frontend) - Ahora con cantidad e imagen
                        const existingItemIndex = window.cart.findIndex(item => item.variantId === variantId);

                        if (existingItemIndex > -1) {
                            // Asegurar que la cantidad existente sea un número antes de sumar
                            window.cart[existingItemIndex].quantity = (typeof window.cart[existingItemIndex].quantity === 'number' && !isNaN(window.cart[existingItemIndex].quantity)) ? window.cart[existingItemIndex].quantity : 0;
                            window.cart[existingItemIndex].quantity += quantity;
                        } else {
                            window.cart.push({
                                id: productId,
                                name: productName,
                                price: productPrice, // Ya es un número
                                color: color,
                                variantId: variantId,
                                quantity: quantity, // Ya es un número
                                imageUrl: imageUrl // Ya es una cadena válida
                            });
                        }

                        guardarCarritoLocal(); // ✅ Guardar después de añadir
                        updateCartDisplay(); // Para actualizar el modal del carrito y contadores
                    } else if (data.error) {
                        showMessageModal("❌ Error", "Error: " + data.error);
                    }
                })
                .catch((error) => {
                    console.error("❌ Error al agregar al carrito (fetch):", error);
                    showMessageModal("❌ Error de Conexión", "Hubo un problema al añadir el producto al carrito. Inténtalo de nuevo.");
                });
            } else {
                showMessageModal('Cantidad Inválida', 'Por favor, ingresa una cantidad válida.');
            }
        });
    });

    // Asignar la función a los botones de WhatsApp
    if (buyWhatsappButton) {
        buyWhatsappButton.addEventListener("click", sendCartToWhatsApp);
    }
    if (modalBuyWhatsappButton) {
        modalBuyWhatsappButton.addEventListener("click", sendCartToWhatsApp);
    }

    // Inicializar la visualización del carrito al cargar la página
    updateCartDisplay();

    // Lógica para la galería de imágenes del producto (NUEVO)
    const mainProductImage = document.getElementById('main-product-image');
    const productThumbnails = document.querySelectorAll('.product-thumbnail');

    if (mainProductImage && productThumbnails.length > 0) {
        productThumbnails.forEach(thumbnail => {
            thumbnail.addEventListener('click', function() {
                // Remover la clase 'selected' de todas las miniaturas
                productThumbnails.forEach(t => t.classList.remove('selected'));
                // Añadir la clase 'selected' a la miniatura clickeada
                this.classList.add('selected');
                // Actualizar la imagen principal con la URL de la miniatura clickeada
                mainProductImage.src = this.src;
            });
        });

        // Opcional: Asegurarse de que la primera miniatura esté seleccionada al cargar la página
        if (productThumbnails[0]) {
            productThumbnails[0].classList.add('selected');
        }
    }

}); // Fin de DOMContentLoaded
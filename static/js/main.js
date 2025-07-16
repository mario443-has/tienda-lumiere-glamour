// =====================================================================
// Funciones y variables globales (accesibles desde cualquier parte)
// =====================================================================

// Función para obtener el token CSRF
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
// (Asumiendo que notifications.js las define o que son definidas aquí)
function showMessageModal(title, message) {
    const messageModal = document.getElementById('message-modal');
    const messageModalTitle = document.getElementById('message-modal-title');
    const messageModalContent = document.getElementById('message-modal-content');
    if (messageModal && messageModalTitle && messageModalContent) {
        messageModalTitle.innerText = title;
        messageModalContent.innerText = message;
        messageModal.classList.remove('hidden');
    }
}

function closeMessageModal() {
    const messageModal = document.getElementById('message-modal');
    if (messageModal) {
        messageModal.classList.add('hidden');
    }
}

// --- Funciones del Carrito ---
// Referencias a elementos del DOM para las funciones globales del carrito
// Estas se inicializarán en DOMContentLoaded
let cartModalElement; // Referencia al nuevo modal flotante del carrito (id="carrito-modal")
let cartContentContainer; // Referencia al contenedor de ítems del carrito (id="contenido-carrito")
let emptyCartMessage; // Mensaje de carrito vacío (puede ser un elemento dentro del modal)
let cartTotalSpan;    // Span para mostrar el total del carrito (id="cart-total")
let buyWhatsappButton; // Botón flotante de WhatsApp (fuera del modal)
let buyWhatsappCartCountSpan; // Contador del botón flotante de WhatsApp
let whatsappOrderButton; // Botón "Pedir por WhatsApp" dentro del modal (id="whatsapp-pedido")
let cartCountElement; // Contador superior del carrito (en el header)
let bottomNavCartCount; // Contador del carrito en la barra de navegación inferior

// Función para inicializar elementos del DOM relacionados con el carrito
function initializeCartDomElements() {
    cartModalElement = document.getElementById("carrito-modal"); // Nuevo ID del modal principal
    cartContentContainer = document.getElementById("contenido-carrito"); // Nuevo ID del contenedor de contenido
    // emptyCartMessage = document.getElementById("empty-cart-message"); // Este ID puede no existir si el mensaje se renderiza dinámicamente
    cartTotalSpan = document.getElementById("cart-total");          // Asumiendo que este ID se mantiene dentro del modal
    buyWhatsappButton = document.getElementById("buy-whatsapp-button");
    buyWhatsappCartCountSpan = document.getElementById("buy-whatsapp-cart-count");
    whatsappOrderButton = document.getElementById("whatsapp-pedido"); // Nuevo ID del botón de WhatsApp en el modal
    cartCountElement = document.getElementById("cart-count");
    bottomNavCartCount = document.getElementById("bottom-nav-cart-count");

    // Nuevos botones del HTML del usuario para abrir/cerrar el modal
    const closeCartButton = document.getElementById("cerrar-carrito");
    const continueShoppingButton = document.getElementById("seguir-comprando");
    
    // Obtener ambos botones de abrir carrito por sus IDs únicos
    const openCartButtonDesktop = document.getElementById("abrir-carrito-desktop");
    const openCartButtonMobile = document.getElementById("abrir-carrito-mobile");

    if (closeCartButton) {
        closeCartButton.addEventListener("click", closeCartModal);
    }
    if (continueShoppingButton) {
        continueShoppingButton.addEventListener("click", closeCartModal);
    }
    // Adjuntar listeners a ambos botones de abrir carrito
    if (openCartButtonDesktop) {
        openCartButtonDesktop.addEventListener("click", openCartModal);
    }
    if (openCartButtonMobile) {
        openCartButtonMobile.addEventListener("click", openCartModal);
    }
}

// Función para abrir el modal del carrito
function openCartModal() {
    if (cartModalElement) {
        cartModalElement.classList.remove("hidden");
        updateCartDisplay(); // Asegura que el contenido del carrito esté actualizado al abrir el modal
    }
}

// Función para cerrar el modal del carrito
function closeCartModal() {
    if (cartModalElement) {
        cartModalElement.classList.add("hidden");
    }
}

// Cargar el carrito desde localStorage cuando se inicia
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

// Guardar el carrito en localStorage después de modificarlo
function guardarCarritoLocal() {
  localStorage.setItem('carritoLumiere', JSON.stringify(window.cart));
}

// Formatear precio con separador de miles y símbolo de dólar (sin COP)
function formatPriceForDisplay(price) {
    return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP', // Usamos COP para el formato interno, pero solo mostraremos el símbolo
        minimumFractionDigits: 0, // No mostrar decimales
        maximumFractionDigits: 0, // No mostrar decimales
    }).format(price).replace('COP', '').trim(); // Eliminar "COP" y espacios extra
}


// Actualizar contadores del carrito en la UI
function actualizarContadorCarrito() {
    if (!cartCountElement) initializeCartDomElements(); // Asegurar inicialización

    let totalItemsInCart = 0;
    window.cart.forEach(item => {
        totalItemsInCart += (typeof item.quantity === 'number' && !isNaN(item.quantity)) ? item.quantity : 1;
    });

    // Actualizar todos los contadores del carrito
    [cartCountElement, bottomNavCartCount].forEach(counter => {
        if (counter) {
            counter.textContent = totalItemsInCart;
            counter.classList.toggle('hidden', totalItemsInCart === 0);
        }
    });

    // Actualizar el contador del botón de WhatsApp
    if (buyWhatsappButton && buyWhatsappCartCountSpan) {
        buyWhatsappCartCountSpan.textContent = totalItemsInCart;
        buyWhatsappButton.classList.toggle('hidden', totalItemsInCart === 0);
    }
}

// Renderizar los ítems del carrito en el modal
function renderCartItems() {
    if (!cartContentContainer) initializeCartDomElements(); // Asegurar inicialización

    if (!cartContentContainer) {
        console.error("El contenedor de contenido del carrito no se encontró.");
        return;
    }

    cartContentContainer.innerHTML = ""; // Limpiar el contenedor actual
    let total = 0;

    if (window.cart.length === 0) {
        cartContentContainer.innerHTML = "<p class='text-gray-500 text-center'>Tu carrito está vacío.</p>";
    } else {
        let html = "";
        window.cart.forEach((item, index) => {
            const itemPrice = parseFloat(item.price) || 0;
            const itemQuantity = (typeof item.quantity === 'number' && !isNaN(item.quantity)) ? item.quantity : 1;
            const imageUrlToDisplay = item.imageUrl || window.placeholderImageUrl || '/static/img/sin_imagen.jpg';
            const subtotalItem = itemPrice * itemQuantity;
            total += subtotalItem;

            html += `
                <div class="flex items-center justify-between py-2 border-b border-gray-100">
                    <img src="${imageUrlToDisplay}" alt="${item.name}" class="w-16 h-16 object-cover rounded-md mr-3" onerror="this.onerror=null;this.src='${window.placeholderImageUrl || '/static/img/sin_imagen.jpg'}';">
                    <div class="flex-1 min-w-0">
                        <p class="font-semibold text-gray-800">${item.name}</p>
                        ${item.color && item.color !== 'N/A' ? `<p class="text-sm text-gray-600">Color: ${item.color}</p>` : ''}
                        <p class="text-sm text-gray-600">${formatPriceForDisplay(itemPrice)} x ${itemQuantity}</p>
                    </div>
                    <div class="flex items-center gap-2">
                        <button onclick="updateItemQuantity('${item.variantId}', -1)" class="text-red-500 font-bold text-lg p-1 rounded-full hover:bg-red-100 transition-colors duration-200">
                            <i class="fas fa-minus-circle"></i>
                        </button>
                        <span class="font-semibold text-gray-800">${itemQuantity}</span>
                        <button onclick="updateItemQuantity('${item.variantId}', 1)" class="text-green-600 font-bold text-lg p-1 rounded-full hover:bg-green-100 transition-colors duration-200">
                            <i class="fas fa-plus-circle"></i>
                        </button>
                        <button onclick="updateItemQuantity('${item.variantId}', 0)" class="text-gray-500 hover:text-red-700 ml-2">
                            <i class="fas fa-trash-alt"></i>
                        </button>
                    </div>
                </div>`;
        });
        cartContentContainer.innerHTML = html;
    }
    
    // Actualizar el total en el modal
    if (cartTotalSpan) cartTotalSpan.textContent = formatPriceForDisplay(total);

    // Actualizar el enlace de WhatsApp con el mensaje detallado
    if (whatsappOrderButton) {
        const mensajeWhatsApp = generarMensajeWhatsApp(window.cart, total);
        whatsappOrderButton.href = mensajeWhatsApp;
    }
}

// Actualizar la cantidad de un ítem en el carrito
window.updateItemQuantity = function(variantIdToUpdate, change) { // Global para onclick
    const itemIndex = window.cart.findIndex(item => item.variantId === variantIdToUpdate);

    if (itemIndex > -1) {
        window.cart[itemIndex].quantity = (typeof window.cart[itemIndex].quantity === 'number' && !isNaN(window.cart[itemIndex].quantity)) ? window.cart[itemIndex].quantity : 0;

        if (change === 0) {
            window.cart.splice(itemIndex, 1);
            // No mostrar modal de confirmación aquí
        } else {
            window.cart[itemIndex].quantity += change;
            if (window.cart[itemIndex].quantity <= 0) {
                window.cart.splice(itemIndex, 1);
                // No mostrar modal de confirmación aquí
            } else {
                // No mostrar modal de confirmación aquí
            }
        }
        guardarCarritoLocal();
        updateCartDisplay();
    }
}

// Función para generar el mensaje de WhatsApp detallado
function generarMensajeWhatsApp(carrito, total) {
    const whatsappNumber = window.whatsappNumber || '573007221200';
    let texto = "¡Hola! Me gustaría comprar los siguientes productos de mi carrito:\n\n";

    carrito.forEach((item, index) => {
        const itemPrice = parseFloat(item.price) || 0;
        const itemQuantity = (typeof item.quantity === 'number' && !isNaN(item.quantity)) ? item.quantity : 1;
        const subtotalItem = itemPrice * itemQuantity;

        texto += `${index + 1}. ${item.name}`;
        if (item.color && item.color !== 'N/A') {
            texto += ` (Color: ${item.color})`;
        }
        texto += ` - Cantidad: ${itemQuantity} - ${formatPriceForDisplay(subtotalItem)}\n`;
    });

    texto += `\nTotal estimado: ${formatPriceForDisplay(total)}\n`;
    texto += "Por favor, confírmame la disponibilidad y el proceso de pago.";

    return `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(texto)}`;
}


// Enviar el contenido del carrito a WhatsApp (ahora usa generarMensajeWhatsApp)
function sendCartToWhatsApp() {
    if (window.cart.length === 0) {
        showMessageModal('Carrito Vacío', 'Tu carrito está vacío. Agrega productos antes de comprar.');
        return;
    }

    const totalCalculado = window.cart.reduce((sum, item) => sum + (parseFloat(item.price) || 0) * ((typeof item.quantity === 'number' && !isNaN(item.quantity)) ? item.quantity : 1), 0);
    const whatsappUrl = generarMensajeWhatsApp(window.cart, totalCalculado);
    
    window.open(whatsappUrl, "_blank");

    window.cart = []; // Limpiar el carrito después de enviar el pedido
    guardarCarritoLocal();
    updateCartDisplay();
    showMessageModal('Pedido Enviado', 'Tu pedido ha sido enviado a WhatsApp. Revisa tu chat para continuar la compra.');
    closeCartModal();
}

// Función principal para actualizar la visualización del carrito (modal y contadores)
function updateCartDisplay() {
    renderCartItems();
    actualizarContadorCarrito();
}

// --- Funciones de Menú y Navegación ---
// Función para mostrar/ocultar la barra de búsqueda móvil
window.toggleMobileSearch = function() {
    const mobileSearchBar = document.getElementById('mobile-search-bar');
    const mobileMenu = document.getElementById('mobile-menu'); // Referencia al menú móvil
    if (mobileSearchBar) {
        mobileSearchBar.classList.toggle('hidden');
        // Si la barra de búsqueda se abre, asegúrate de que el menú móvil esté oculto
        if (!mobileSearchBar.classList.contains('hidden') && mobileMenu && !mobileMenu.classList.contains('hidden')) {
            mobileMenu.classList.add('hidden');
        }
    }
};

// Helper function to apply favorite state visually
// Busca todos los botones de favorito para un producto dado y aplica/remueve la clase 'active'
function applyFavoriteState(productId, isFavorite) {
    document.querySelectorAll(`.btn-favorito[data-producto-id="${productId}"]`).forEach(button => {
        const icon = button.querySelector('i');
        if (icon) {
            if (isFavorite) {
                icon.classList.add('active');
            } else {
                icon.classList.remove('active');
            }
        }
    });
}

// Toggle de submenús en móvil (para subcategorías)
window.toggleSubmenu = function(button) { // Global para onclick en HTML
    const submenu = button.nextElementSibling; // El div que contiene las subcategorías
    if (submenu) {
        submenu.classList.toggle("hidden");
        const icon = button.querySelector("svg");
        if (icon) {
            // Alternar entre rotación de 0 (flecha hacia abajo) y 90 (flecha hacia la derecha)
            // Asumiendo que el estado inicial es 0 (cerrado) y 90 (abierto).
            // Si el ícono ya tiene rotate-90, significa que está abierto, entonces lo cerramos a 0.
            if (icon.classList.contains('rotate-90')) {
                icon.classList.remove('rotate-90');
                icon.classList.add('rotate-0');
            } else {
                icon.classList.remove('rotate-0');
                icon.classList.add('rotate-90');
            }
        }
    }
};

// Función para manejar la búsqueda en vivo (AJAX)
function handleLiveSearch(searchInput, resultsContainer) {
    let debounceTimer;
    const minLength = 2; // Mínimo de caracteres para comenzar la búsqueda

    return async function() {
        const query = searchInput.value.trim();
        
        clearTimeout(debounceTimer);

        if (query.length < minLength) {
            resultsContainer.innerHTML = ''; // Limpiar resultados
            resultsContainer.classList.add('hidden');
            return;
        }

        debounceTimer = setTimeout(async () => {
            try {
                // CAMBIO CLAVE: La URL de la API de búsqueda en vivo ahora es '/api/buscar-productos/'
                const response = await fetch(`/api/buscar-productos/?q=${encodeURIComponent(query)}`);
                const data = await response.json();

                resultsContainer.innerHTML = '';

                if (data.productos && data.productos.length > 0) { // Asegúrate de que la clave sea 'productos'
                    data.productos.forEach(producto => {
                        const resultItem = document.createElement('a'); // Usar 'a' para que sea un enlace
                        resultItem.href = producto.url; // URL del producto
                        resultItem.classList.add('flex', 'items-center', 'p-2', 'hover:bg-gray-100', 'border-b', 'border-gray-200', 'transition-colors', 'duration-200');
                        resultItem.innerHTML = `
                            <img src="${producto.imagen || window.placeholderImageUrl}" 
                                 alt="${producto.nombre}" 
                                 class="w-12 h-12 object-cover rounded-md mr-3"
                                 onerror="this.onerror=null;this.src='${window.placeholderImageUrl}';">
                            <div class="flex-1">
                                <div class="font-medium text-gray-800">${producto.nombre}</div>
                                <div class="text-sm text-pink-600">${producto.precio}</div>
                            </div>
                        `;
                        resultsContainer.appendChild(resultItem);
                    });
                    resultsContainer.classList.remove('hidden');
                } else {
                    resultsContainer.innerHTML = `
                        <div class="p-4 text-center text-gray-500">
                            No se encontraron productos que coincidan con "${query}"
                        </div>
                    `;
                    resultsContainer.classList.remove('hidden');
                }
            } catch (error) {
                console.error('Error en la búsqueda:', error);
                // Opcional: Mostrar un mensaje de error en el contenedor de resultados
                resultsContainer.innerHTML = `
                    <div class="p-4 text-center text-red-500">
                        Error al cargar resultados. Intenta de nuevo.
                    </div>
                `;
                resultsContainer.classList.remove('hidden');
            }
        }, 300); // 300ms de retraso (debounce)
    };
}

// Función para posicionar el contenedor de resultados de búsqueda
function positionSearchResults(searchInput, resultsContainer) {
    const inputRect = searchInput.getBoundingClientRect();
    
    resultsContainer.style.position = 'absolute';
    resultsContainer.style.top = `${inputRect.bottom + window.scrollY}px`;
    resultsContainer.style.left = `${inputRect.left}px`;
    resultsContainer.style.width = `${inputRect.width}px`;
    resultsContainer.style.zIndex = '50';
}

// --- Lógica del Carrusel de Anuncios ---
let currentIndex = 0; // Índice actual del carrusel (0-based para items reales)
let totalSlides = 0; // Número total de slides reales
let autoSlideInterval;
let isTransitioning = false;
let carousel; // Elemento del carrusel
let items = []; // Elementos de los slides (incluyendo clones)
let prevBtn; // Botón anterior
let nextBtn; // Botón siguiente
let indicators = []; // Indicadores de slide

function cloneSlides() {
    if (!carousel || items.length === 0) return;
    
    // Clonar el primer y último slide real
    const firstClone = items[0].cloneNode(true);
    const lastClone = items[items.length - 1].cloneNode(true);
    
    // Añadir clases para identificarlos
    firstClone.classList.add('clone');
    lastClone.classList.add('clone');
    
    // Añadir los clones al carrusel
    carousel.appendChild(firstClone);
    carousel.insertBefore(lastClone, items[0]);
    
    // Re-obtener items para incluir los clones
    items = carousel.querySelectorAll(".carousel-item");
    totalSlides = items.length - 2; // El número real de slides sin clones
    currentIndex = 1; // Comenzar en el primer slide real (índice 1 debido al clon inicial)
}

function updateCarousel(animate = true) {
    if (!carousel || items.length === 0) return;
    
    carousel.style.transition = animate ? 'transform 0.5s ease-in-out' : 'none';
    const offset = -currentIndex * 100;
    carousel.style.transform = `translateX(${offset}%)`;

    // Actualizar indicadores (mostrar el índice real, no el de los clones)
    const realIndex = (currentIndex - 1 + totalSlides) % totalSlides;
    indicators.forEach((dot, i) => {
        dot.classList.toggle("opacity-100", i === realIndex);
        dot.classList.toggle("opacity-50", i !== realIndex);
    });

    if (!animate) return;

    // Manejar el efecto infinito después de la transición
    carousel.addEventListener('transitionend', function handler() {
        if (currentIndex === 0) { // Si llegamos al clon del último slide
            carousel.style.transition = 'none';
            currentIndex = totalSlides;
            carousel.style.transform = `translateX(-${currentIndex * 100}%)`;
        } else if (currentIndex === totalSlides + 1) { // Si llegamos al clon del primer slide
            carousel.style.transition = 'none';
            currentIndex = 1;
            carousel.style.transform = `translateX(-${currentIndex * 100}%)`;
        }
        isTransitioning = false;
        carousel.removeEventListener('transitionend', handler); // Remover el listener para evitar múltiples llamadas
    });
}

function goToSlide(index, animate = true) {
    if (isTransitioning) return;
    isTransitioning = true;
    currentIndex = index;
    updateCarousel(animate);
}

function startAutoSlide() {
    stopAutoSlide();
    if (totalSlides > 1) {
        autoSlideInterval = setInterval(() => {
            if (!isTransitioning) {
                goToSlide(currentIndex + 1);
            }
        }, 5000); // Cambia el slide cada 5 segundos
    }
}

function stopAutoSlide() {
    clearInterval(autoSlideInterval);
}

// --- Lógica de selección de color para variantes de producto ---
function setupColorOptions() {
    document.querySelectorAll('.color-option').forEach(colorOption => {
        colorOption.addEventListener('click', function() {
            const parentProductDiv = this.closest('[data-product-id]');
            const productId = parentProductDiv ? parentProductDiv.dataset.productId : null;

            const selectedVariantId = this.dataset.variantId;
            const selectedColorName = this.dataset.colorName;
            const selectedVariantImage = this.dataset.variantImage;
            const selectedVariantPrice = this.dataset.variantPrice;

            const productImage = productId ? parentProductDiv.querySelector(`#product-image-${productId}`) : null;
            if (productImage) {
                productImage.src = selectedVariantImage;
            }

            const productPriceSpan = productId ? parentProductDiv.querySelector(`#product-price-${productId}`) : null;
            if (productPriceSpan) {
                productPriceSpan.textContent = formatPriceForDisplay(selectedVariantPrice);
            }

            if (parentProductDiv) {
                parentProductDiv.querySelectorAll('.color-option').forEach(option => {
                    option.classList.remove('selected');
                });
            }
            this.classList.add('selected');

            const addToCartButton = parentProductDiv ? parentProductDiv.querySelector('.btn-agregar-carrito') : null;
            if (addToCartButton) {
                addToCartButton.dataset.selectedVariantId = selectedVariantId;
                addToCartButton.dataset.productPrice = selectedVariantPrice;
                addToCartButton.dataset.selectedColor = selectedColorName;
                addToCartButton.dataset.productImageUrl = selectedVariantImage;
            }
        });
    });
}

// Lógica para el botón de "más colores"
function setupMoreColorsButton() {
    document.querySelectorAll('.more-colors-button').forEach(button => {
        button.addEventListener('click', function() {
            const productId = this.dataset.productId;
            const additionalColorsContainer = document.getElementById(`additional-colors-${productId}`);
            if (additionalColorsContainer) {
                additionalColorsContainer.classList.toggle('hidden');
                additionalColorsContainer.classList.toggle('visible');
            }
        });
    });
}

// Lógica para añadir al carrito (unificada para todos los botones .btn-agregar-carrito)
function setupAddToCartButtons() {
    const botonesAgregar = document.querySelectorAll(".btn-agregar-carrito");

    botonesAgregar.forEach(function (boton) {
        boton.addEventListener("click", function () {
            const productId = boton.getAttribute("data-product-id");
            const productName = boton.getAttribute("data-product-name");
            const productPrice = parseFloat(boton.getAttribute("data-product-price")) || 0;
            const variantId = boton.getAttribute("data-selected-variant-id") || productId;
            const color = boton.getAttribute("data-selected-color") || 'N/A';
            const imageUrl = boton.getAttribute("data-product-image-url") || window.placeholderImageUrl;

            let quantity = 1;
            const parentContainer = boton.closest('.bg-white');
            if (parentContainer) {
                const quantityInput = parentContainer.querySelector("input[type='number']");
                if (quantityInput) {
                    quantity = parseInt(quantityInput.value);
                    if (isNaN(quantity) || quantity <= 0) {
                        quantity = 1;
                    }
                }
            }

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
                        color: color
                    }),
                })
                .then((response) => response.json())
                .then((data) => {
                    if (data.mensaje) {
                        showMessageModal("✅ Producto añadido", "Producto: " + productName + " ha sido añadido al carrito.");
                        const existingItemIndex = window.cart.findIndex(item => item.variantId === variantId);

                        if (existingItemIndex > -1) {
                            window.cart[existingItemIndex].quantity = (typeof window.cart[existingItemIndex].quantity === 'number' && !isNaN(window.cart[existingItemIndex].quantity)) ? window.cart[existingItemIndex].quantity : 0;
                            window.cart[existingItemIndex].quantity += quantity;
                        } else {
                            window.cart.push({
                                id: productId,
                                name: productName,
                                price: productPrice,
                                color: color,
                                variantId: variantId,
                                quantity: quantity,
                                imageUrl: imageUrl
                            });
                        }
                        guardarCarritoLocal();
                        updateCartDisplay();
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
}

// Asignar la función a los botones de WhatsApp
function setupWhatsappButtons() {
    if (buyWhatsappButton) {
        buyWhatsappButton.addEventListener("click", sendCartToWhatsApp);
    }
    if (whatsappOrderButton) { // Cambiado de modalBuyWhatsappButton
        whatsappOrderButton.addEventListener("click", sendCartToWhatsApp);
    }
}

// =====================================================================
// Lógica que se ejecuta cuando el DOM está completamente cargado
// =====================================================================
document.addEventListener("DOMContentLoaded", function () {
    // Inicializar elementos del DOM relacionados con el carrito y modales
    initializeCartDomElements();
    cargarCarritoLocal(); // Cargar el carrito al inicio
    updateCartDisplay(); // Actualizar la visualización del carrito

    // La función updateCartCounts() ya no es necesaria aquí, se maneja con actualizarContadorCarrito()
    // y se llama desde updateCartDisplay().
    // Se elimina el código de placeholder.


    // Inicializar el carrusel de anuncios
    carousel = document.getElementById("announcement-carousel");
    prevBtn = document.getElementById("prev-announcement");
    nextBtn = document.getElementById("next-announcement");
    const indicatorsContainer = document.getElementById("carousel-indicators");
    items = carousel ? carousel.querySelectorAll(".carousel-item") : []; // Re-obtener items aquí
    indicators = indicatorsContainer ? indicatorsContainer.querySelectorAll(".indicator") : [];

    if (carousel && items.length > 0) {
        cloneSlides(); // Clonar slides para el efecto infinito
        updateCarousel(false); // Posicionar sin animación inicialmente
        startAutoSlide(); // Iniciar auto-deslizamiento

        // Event listeners para los botones de navegación del carrusel
        if (prevBtn) {
            prevBtn.addEventListener("click", () => {
                if (!isTransitioning) {
                    stopAutoSlide();
                    goToSlide(currentIndex - 1);
                    startAutoSlide();
                }
            });
        }

        if (nextBtn) {
            nextBtn.addEventListener("click", () => {
                if (!isTransitioning) {
                    stopAutoSlide();
                    goToSlide(currentIndex + 1);
                    startAutoSlide();
                }
            });
        }

        // Event listeners para los indicadores del carrusel
        if (indicatorsContainer) {
            indicators.forEach((dot, i) => {
                dot.addEventListener("click", () => {
                    stopAutoSlide();
                    goToSlide(i + 1); // +1 porque los slides reales empiezan en índice 1 (por el clon)
                    startAutoSlide();
                });
            });
        }

        // Lógica de arrastre (swipe) para el carrusel
        const carouselWrapper = document.getElementById("announcement-carousel-wrapper");
        let startX = 0;
        let isDragging = false;
        let dragThreshold = 50;

        if (carouselWrapper) {
            carouselWrapper.addEventListener("touchstart", (e) => {
                startX = e.touches[0].clientX;
                isDragging = true;
                stopAutoSlide();
            }, { passive: true });

            carouselWrapper.addEventListener("touchmove", (e) => {
                if (!isDragging) return;
                const currentX = e.touches[0].clientX;
                const diffX = currentX - startX;

                if (Math.abs(diffX) > dragThreshold) {
                    if (diffX < 0) { // Deslizar a la izquierda (siguiente slide)
                        goToSlide(currentIndex + 1);
                    } else { // Deslizar a la derecha (slide anterior)
                        goToSlide(currentIndex - 1);
                    }
                    isDragging = false; // Resetear el arrastre después de un movimiento
                    startX = currentX; // Actualizar startX para el siguiente arrastre
                }
            }, { passive: true });

            carouselWrapper.addEventListener("touchend", () => {
                isDragging = false;
                startAutoSlide();
            });

            carouselWrapper.addEventListener("touchcancel", () => {
                isDragging = false;
                startAutoSlide();
            });
        }

        // Observador de redimensionamiento para el carrusel
        const resizeObserver = new ResizeObserver(() => {
            if (carouselWrapper && carousel) {
                updateCarousel(false); // Actualizar posición sin animación al redimensionar
            }
        });
        if (carouselWrapper) {
            resizeObserver.observe(carouselWrapper);
        }
    }

    // Inicializar búsqueda en vivo
    const searchInputs = document.querySelectorAll('.search-input');
    searchInputs.forEach(searchInput => {
        let debounceTimer;
        const minLength = 2; // Mínimo de caracteres para comenzar la búsqueda

        const resultsContainer = searchInput.closest('form').nextElementSibling; // Lógica simplificada

        if (!resultsContainer || !resultsContainer.classList.contains('search-results')) {
            console.error('No se encontró el contenedor de resultados de búsqueda para este input.');
            return;
        }

        const searchHandler = handleLiveSearch(searchInput, resultsContainer);
        searchInput.addEventListener('input', searchHandler);

        // Ocultar resultados al hacer clic fuera
        document.addEventListener('click', (e) => {
            if (!searchInput.contains(e.target) && !resultsContainer.contains(e.target)) {
                resultsContainer.classList.add('hidden');
            }
        });

        // Prevenir cierre al hacer clic en los resultados (para permitir navegación)
        resultsContainer.addEventListener('click', (e) => {
            e.stopPropagation();
        });
    });
    
    // Configurar los botones de WhatsApp
    setupWhatsappButtons();

    // Configurar la lógica de selección de color y el botón "más colores"
    setupColorOptions();
    setupMoreColorsButton();

    // Configurar los botones de "Agregar al Carrito"
    setupAddToCartButtons();

    // ===============================
    // Miniaturas que cambian imagen principal (página de detalle de producto)
    // ===============================
    const mainImage = document.getElementById("main-product-image");
    const thumbnails = document.querySelectorAll(".thumbnail-image");

    thumbnails.forEach((thumbnail) => {
      thumbnail.addEventListener("click", function () {
        if (mainImage) {
          mainImage.src = this.src;
        }
        thumbnails.forEach(t => t.classList.remove("ring-2", "ring-pink-500"));
        this.classList.add("ring-2", "ring-pink-500");
      });
    });

    // Lógica para el menú móvil (Hamburger)
    const mobileMenuButton = document.getElementById("mobile-menu-button");
    const mobileMenu = document.getElementById("mobile-menu");
    const mobileCategoriesButton = document.getElementById("mobile-categories-button");
    const mobileCategoriesDropdown = document.getElementById("mobile-categories-dropdown");
    const bottomNavCategoriesButton = document.getElementById("bottom-nav-categories-button"); // Botón de categorías en la barra inferior

    // Toggle del menú principal móvil
    if (mobileMenuButton) {
        mobileMenuButton.addEventListener("click", function() {
            mobileMenu.classList.toggle("hidden");
            // Asegurarse de que la barra de búsqueda móvil esté oculta si el menú se abre
            const mobileSearchBar = document.getElementById('mobile-search-bar');
            if (mobileSearchBar && !mobileSearchBar.classList.contains('hidden')) {
                mobileSearchBar.classList.add('hidden');
            }
        });
    }

    // Toggle del dropdown de categorías en móvil (menú principal)
    if (mobileCategoriesButton) {
        mobileCategoriesButton.addEventListener("click", () => {
            if (mobileCategoriesDropdown) mobileCategoriesDropdown.classList.toggle("hidden");
            const icon = mobileCategoriesButton.querySelector("svg");
            if (icon) {
                icon.classList.toggle("rotate-0");
                icon.classList.toggle("rotate-180");
            }
        });
    }

    // Manejar el botón de categorías de la barra de navegación inferior
    if (bottomNavCategoriesButton) {
        bottomNavCategoriesButton.addEventListener('click', function() {
            mobileMenu.classList.remove('hidden'); // Abrir el menú móvil
            // Asegurarse de que el dropdown de categorías esté visible dentro del menú móvil
            if (mobileCategoriesDropdown && mobileCategoriesDropdown.classList.contains('hidden')) {
                mobileCategoriesDropdown.classList.remove('hidden');
                if (mobileCategoriesButton) {
                    // Asegurar que el ícono de la flecha de categorías esté en estado "abierto"
                    mobileCategoriesButton.querySelector('svg').classList.remove('rotate-0');
                    mobileCategoriesButton.querySelector('svg').classList.add('rotate-180');
                }
            }
            // Ocultar la barra de búsqueda móvil si está abierta
            const mobileSearchBar = document.getElementById('mobile-search-bar');
            if (mobileSearchBar && !mobileSearchBar.classList.contains('hidden')) {
                mobileSearchBar.classList.add('hidden');
            }
        });
    }

    // Lógica para el slider horizontal de productos (si existe)
    const slider = document.getElementById("slider");
    const slideLeft = document.getElementById("slideLeft");
    const slideRight = document.getElementById("slideRight");
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

    // Lógica para inicializar el estado de favoritos desde localStorage al cargar la página
    // Ahora usa la función applyFavoriteState para mayor consistencia
    const favoriteButtons = document.querySelectorAll(".btn-favorito");
    favoriteButtons.forEach(button => {
        const productId = button.dataset.productId;
        const isFavoriteInLocalStorage = localStorage.getItem(`favorito-${productId}`) === 'true';
        applyFavoriteState(productId, isFavoriteInLocalStorage);
        console.log(`Inicializando: Producto ${productId}, localStorage: ${isFavoriteInLocalStorage ? 'marcado' : 'desmarcado'}`);
    });
});
// =====================================================================
// Funciones y variables globales
// =====================================================================

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

// --- Variables del carrito ---
let cartModalElement;
let cartContentContainer;
let cartTotalSpan;
let buyWhatsappButton;
let buyWhatsappCartCountSpan;
let whatsappOrderButton;
let cartCountElement;
let bottomNavCartCount;

function initializeCartDomElements() {
    cartModalElement = document.getElementById("carrito-modal");
    cartContentContainer = document.getElementById("contenido-carrito");
    cartTotalSpan = document.getElementById("cart-total");
    buyWhatsappButton = document.getElementById("buy-whatsapp-button");
    buyWhatsappCartCountSpan = document.getElementById("buy-whatsapp-cart-count");
    whatsappOrderButton = document.getElementById("whatsapp-pedido");
    cartCountElement = document.getElementById("cart-count");
    bottomNavCartCount = document.getElementById("bottom-nav-cart-count");

    const closeCartButton = document.getElementById("cerrar-carrito");
    const continueShoppingButton = document.getElementById("seguir-comprando");
    const openCartButtonDesktop = document.getElementById("abrir-carrito-desktop");
    const openCartButtonMobile = document.getElementById("abrir-carrito-mobile");

    if (closeCartButton) closeCartButton.addEventListener("click", closeCartModal);
    if (continueShoppingButton) continueShoppingButton.addEventListener("click", closeCartModal);
    if (openCartButtonDesktop) openCartButtonDesktop.addEventListener("click", openCartModal);
    if (openCartButtonMobile) openCartButtonMobile.addEventListener("click", openCartModal);
}

// --- Apertura y cierre del carrito ---
function openCartModal() {
    if (cartModalElement) {
        cartModalElement.classList.remove("hidden");
        updateCartDisplay();
    }
}

function closeCartModal() {
    if (cartModalElement) cartModalElement.classList.add("hidden");
}

// --- LocalStorage del carrito ---
function cargarCarritoLocal() {
    const carritoGuardado = localStorage.getItem('carritoLumiere');
    if (carritoGuardado) {
        window.cart = JSON.parse(carritoGuardado);
        window.cart.forEach(item => {
            item.quantity = (typeof item.quantity === 'number' && !isNaN(item.quantity)) ? item.quantity : 1;
            item.price = parseFloat(item.price) || 0;
            item.imageUrl = item.imageUrl || window.placeholderImageUrl || '/static/img/sin_imagen.jpg';
        });
    } else {
        window.cart = [];
    }
}

function guardarCarritoLocal() {
    localStorage.setItem('carritoLumiere', JSON.stringify(window.cart));
}

// --- Formato de precio ---
function formatPriceForDisplay(price) {
    return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(price).replace('COP', '').trim();
}

// --- Contador de carrito ---
function actualizarContadorCarrito() {
    if (!cartCountElement) initializeCartDomElements();

    let totalItemsInCart = 0;
    window.cart.forEach(item => {
        totalItemsInCart += (typeof item.quantity === 'number' && !isNaN(item.quantity)) ? item.quantity : 1;
    });

    [cartCountElement, bottomNavCartCount].forEach(counter => {
        if (counter) {
            counter.textContent = totalItemsInCart;
            counter.classList.toggle('hidden', totalItemsInCart === 0);
        }
    });

    if (buyWhatsappButton && buyWhatsappCartCountSpan) {
        buyWhatsappCartCountSpan.textContent = totalItemsInCart;
        buyWhatsappButton.classList.toggle('hidden', totalItemsInCart === 0);
    }
}

// --- Render del carrito ---
function renderCartItems() {
    if (!cartContentContainer) initializeCartDomElements();
    if (!cartContentContainer) return;

    cartContentContainer.innerHTML = "";
    let total = 0;

    if (window.cart.length === 0) {
        cartContentContainer.innerHTML = "<p class='text-gray-500 text-center'>Tu carrito está vacío.</p>";
    } else {
        let html = "";
        window.cart.forEach((item) => {
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

    if (cartTotalSpan) cartTotalSpan.textContent = formatPriceForDisplay(total);

    if (whatsappOrderButton) {
        const mensajeWhatsApp = generarMensajeWhatsApp(window.cart, total);
        whatsappOrderButton.href = mensajeWhatsApp;
    }
}

// --- Actualizar cantidad ---
window.updateItemQuantity = function(variantIdToUpdate, change) {
    const itemIndex = window.cart.findIndex(item => item.variantId === variantIdToUpdate);
    if (itemIndex > -1) {
        window.cart[itemIndex].quantity = (typeof window.cart[itemIndex].quantity === 'number' && !isNaN(window.cart[itemIndex].quantity)) ? window.cart[itemIndex].quantity : 0;
        if (change === 0) {
            window.cart.splice(itemIndex, 1);
        } else {
            window.cart[itemIndex].quantity += change;
            if (window.cart[itemIndex].quantity <= 0) window.cart.splice(itemIndex, 1);
        }
        guardarCarritoLocal();
        updateCartDisplay();
    }
}

// --- Generar mensaje WhatsApp ---
function generarMensajeWhatsApp(carrito, total) {
    const whatsappNumber = window.whatsappNumber || '573007221200';
    let texto = "¡Hola! Me gustaría comprar los siguientes productos:\n\n";

    carrito.forEach((item, index) => {
        const itemPrice = parseFloat(item.price) || 0;
        const itemQuantity = (typeof item.quantity === 'number' && !isNaN(item.quantity)) ? item.quantity : 1;
        const subtotalItem = itemPrice * itemQuantity;
        texto += `${index + 1}. ${item.name}`;
        if (item.color && item.color !== 'N/A') texto += ` (Color: ${item.color})`;
        texto += ` - Cantidad: ${itemQuantity} - ${formatPriceForDisplay(subtotalItem)}\n`;
    });

    texto += `\nTotal estimado: ${formatPriceForDisplay(total)}\n`;
    texto += "Por favor, confírmame la disponibilidad y el proceso de pago.";

    return `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(texto)}`;
}

// --- Enviar carrito a WhatsApp ---
function sendCartToWhatsApp() {
    if (window.cart.length === 0) {
        showMessageModal('Carrito Vacío', 'Tu carrito está vacío. Agrega productos antes de comprar.');
        return;
    }

    const totalCalculado = window.cart.reduce((sum, item) => sum + (parseFloat(item.price) || 0) * ((typeof item.quantity === 'number' && !isNaN(item.quantity)) ? item.quantity : 1), 0);
    const whatsappUrl = generarMensajeWhatsApp(window.cart, totalCalculado);

    window.open(whatsappUrl, "_blank");
    window.cart = [];
    guardarCarritoLocal();
    updateCartDisplay();
    showMessageModal('Pedido Enviado', 'Tu pedido ha sido enviado a WhatsApp.');
    closeCartModal();
}

// --- Favoritos corregido ---
function applyFavoriteState(productId, isFavorite) {
    const buttons = document.querySelectorAll(`.btn-favorito[data-product-id="${productId}"]`);
    buttons.forEach(button => {
        const icon = button.querySelector("i");
        if (!icon) return;
        icon.classList.remove("fa-heart", "fa-regular", "fa-solid", "text-gray-500", "text-red-500", "animate-bounce");
        if (isFavorite) {
            icon.classList.add("fa-solid", "fa-heart", "text-red-500", "animate-bounce");
            button.classList.add("active");
        } else {
            icon.classList.add("fa-regular", "fa-heart", "text-gray-500");
            button.classList.remove("active");
        }
    });
}

function repararFavoritosLocales() {
    const keys = Object.keys(localStorage).filter(k => k.startsWith("favorito-"));
    keys.forEach(key => {
        const valor = localStorage.getItem(key);
        if (valor !== "true" && valor !== "false") localStorage.removeItem(key);
    });
}

function toggleFavorito(button, productoId) {
    const currentValue = localStorage.getItem(`favorito-${productoId}`) === "true";
    const newValue = !currentValue;
    localStorage.setItem(`favorito-${productoId}`, newValue ? "true" : "false");
    applyFavoriteState(productoId, newValue);
}

function updateFavoritesView() {
    document.querySelectorAll(".btn-favorito").forEach((btn) => {
        const productId = btn.dataset.productId;
        const isFav = localStorage.getItem(`favorito-${productId}`) === "true";
        applyFavoriteState(productId, isFav);
    });

    const container = document.getElementById("favoritos-container");
    if (container) {
        const favoritosActivos = document.querySelectorAll(".product-card .btn-favorito.active");
        if (favoritosActivos.length === 0) {
            container.innerHTML = "<p class='text-center text-gray-500 py-8'>No tienes productos en favoritos.</p>";
        }
    }
}

// --- WhatsApp ---
function setupWhatsappButtons() {
    if (buyWhatsappButton) buyWhatsappButton.addEventListener("click", sendCartToWhatsApp);
    if (whatsappOrderButton) whatsappOrderButton.addEventListener("click", sendCartToWhatsApp);
}

// --- Variantes de color ---
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
            if (productImage) productImage.src = selectedVariantImage;

            const productPriceSpan = productId ? parentProductDiv.querySelector(`#product-price-${productId}`) : null;
            if (productPriceSpan) productPriceSpan.textContent = formatPriceForDisplay(selectedVariantPrice);

            if (parentProductDiv) {
                parentProductDiv.querySelectorAll('.color-option').forEach(option => option.classList.remove('selected'));
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

// --- Inicialización ---
document.addEventListener("DOMContentLoaded", function () {
    initializeCartDomElements();
    cargarCarritoLocal();
    updateCartDisplay();

    setupWhatsappButtons();
    repararFavoritosLocales();
    updateFavoritesView();
    setupColorOptions();
    setupMoreColorsButton();

    // --- Favoritos ---
    document.addEventListener("click", (event) => {
        const btn = event.target.closest(".btn-favorito");
        if (btn) toggleFavorito(btn, btn.dataset.productId);
    });

    // --- Botones de carrito con feedback visual ---
    document.querySelectorAll(".btn-agregar-carrito").forEach((boton) => {
        boton.addEventListener("click", function () {
            const productId = boton.dataset.productId;
            const productName = boton.dataset.productName;
            const productPrice = parseFloat(boton.dataset.productPrice) || 0;
            const variantId = boton.dataset.selectedVariantId || productId;
            const color = boton.dataset.selectedColor || 'N/A';
            const imageUrl = boton.dataset.productImageUrl || window.placeholderImageUrl;
            let quantity = 1;

            const parentContainer = boton.closest('.bg-white');
            if (parentContainer) {
                const quantityInput = parentContainer.querySelector("input[type='number']");
                if (quantityInput) {
                    quantity = parseInt(quantityInput.value);
                    if (isNaN(quantity) || quantity <= 0) quantity = 1;
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

                        // --- Feedback visual ---
                        const originalText = boton.querySelector("span").textContent;
                        boton.disabled = true;
                        boton.querySelector("span").textContent = "Añadido ✅";
                        boton.classList.add("bg-green-500", "hover:bg-green-600");
                        boton.classList.remove("bg-pink-600", "hover:bg-pink-700");

                        setTimeout(() => {
                            boton.disabled = false;
                            boton.querySelector("span").textContent = originalText;
                            boton.classList.remove("bg-green-500", "hover:bg-green-600");
                            boton.classList.add("bg-pink-600", "hover:bg-pink-700");
                        }, 1000);

                        // --- Lógica del carrito ---
                        const existingItemIndex = window.cart.findIndex(item => item.variantId === variantId);
                        if (existingItemIndex > -1) {
                            window.cart[existingItemIndex].quantity = (typeof window.cart[existingItemIndex].quantity === 'number' && !isNaN(window.cart[existingItemIndex].quantity)) ? window.cart[existingItemIndex].quantity : 0;
                            window.cart[existingItemIndex].quantity += quantity;
                        } else {
                            window.cart.push({ id: productId, name: productName, price: productPrice, color: color, variantId: variantId, quantity: quantity, imageUrl: imageUrl });
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
});

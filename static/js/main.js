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

// --- Funciones del Carrito ---
// Referencias a elementos del DOM para las funciones globales del carrito
let cartModalElement;
let cartContentContainer;
let emptyCartMessage;
let cartTotalSpan;
let buyWhatsappButton;
let buyWhatsappCartCountSpan;
let whatsappOrderButton;
let cartCountElement;
let bottomNavCartCount;

// Función para inicializar elementos del DOM relacionados con el carrito
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

    if (closeCartButton) {
        closeCartButton.addEventListener("click", closeCartModal);
    }
    if (continueShoppingButton) {
        continueShoppingButton.addEventListener("click", closeCartModal);
    }
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
        updateCartDisplay();
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
        window.cart.forEach(item => {
            item.quantity = (typeof item.quantity === 'number' && !isNaN(item.quantity)) ? item.quantity : 1;
            item.price = parseFloat(item.price) || 0;
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

// Formatear precio
function formatPriceForDisplay(price) {
    return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(price).replace('COP', '').trim();
}

// Actualizar contadores del carrito en la UI
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

// Renderizar los ítems del carrito en el modal
function renderCartItems() {
    if (!cartContentContainer) initializeCartDomElements();

    if (!cartContentContainer) {
        console.error("El contenedor de contenido del carrito no se encontró.");
        return;
    }

    cartContentContainer.innerHTML = "";
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

    if (cartTotalSpan) cartTotalSpan.textContent = formatPriceForDisplay(total);

    if (whatsappOrderButton) {
        const mensajeWhatsApp = generarMensajeWhatsApp(window.cart, total);
        whatsappOrderButton.href = mensajeWhatsApp;
    }
}

// Actualizar la cantidad de un ítem en el carrito
window.updateItemQuantity = function(variantIdToUpdate, change) {
    const itemIndex = window.cart.findIndex(item => item.variantId === variantIdToUpdate);

    if (itemIndex > -1) {
        window.cart[itemIndex].quantity = (typeof window.cart[itemIndex].quantity === 'number' && !isNaN(window.cart[itemIndex].quantity)) ? window.cart[itemIndex].quantity : 0;

        if (change === 0) {
            window.cart.splice(itemIndex, 1);
        } else {
            window.cart[itemIndex].quantity += change;
            if (window.cart[itemIndex].quantity <= 0) {
                window.cart.splice(itemIndex, 1);
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

// Enviar el contenido del carrito a WhatsApp
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
    const mobileMenu = document.getElementById('mobile-menu');
    if (mobileSearchBar) {
        mobileSearchBar.classList.toggle('hidden');
        if (!mobileSearchBar.classList.contains('hidden') && mobileMenu && !mobileMenu.classList.contains('hidden')) {
            mobileMenu.classList.add('hidden');
        }
    }
};

function applyFavoriteState(productId, isFavorite) {
    const buttons = document.querySelectorAll(`.btn-favorito[data-product-id="${productId}"]`);
    console.log("🎯 Aplicando visual:", { productId, isFavorite, buttons });

    buttons.forEach(button => {
        const icon = button.querySelector("i");
        if (!icon) {
            console.warn("⚠️ No se encontró el ícono", button);
            return;
        }

        console.log("🛠 Cambiando clases del ícono", icon.className);

        // 🔄 Reiniciar todas las clases relacionadas con el ícono visual
        icon.classList.remove("fa-regular", "fa-solid", "text-gray-500", "text-red-500", "animate-bounce");

        if (isFavorite) {
            icon.classList.add("fa-solid", "fa-heart", "text-red-500", "animate-bounce");
            button.classList.add("active");
        } else {
            icon.classList.add("fa-regular", "fa-heart", "text-gray-500");
            button.classList.remove("active");
        }
    });
}



// Toggle de submenús en móvil
window.toggleSubmenu = function(button) {
    const submenu = button.nextElementSibling;
    if (submenu) {
        submenu.classList.toggle("hidden");
        const icon = button.querySelector("svg");
        if (icon) {
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
    if (whatsappOrderButton) {
        whatsappOrderButton.addEventListener("click", sendCartToWhatsApp);
    }
}

// 🔄 Reparar favoritos antiguos o corruptos
function repararFavoritosLocales() {
    const keys = Object.keys(localStorage).filter(k => k.startsWith("favorito-"));
    let seCorrigio = false;

    keys.forEach(key => {
        const valor = localStorage.getItem(key);
        if (valor !== "true" && valor !== "false") {
            localStorage.removeItem(key);
            seCorrigio = true;
        }
    });

    if (seCorrigio) {
        console.log("🧹 Favoritos locales reparados.");
    }
}

function toggleFavorito(button, productoId) {
    console.log("🟡 toggleFavorito()", { productoId, button });

    const isNowFavorite = !button.classList.contains("active");
    localStorage.setItem(`favorito-${productoId}`, isNowFavorite ? "true" : "false");

    applyFavoriteState(productoId, isNowFavorite);  // <- forzamos la actualización visual

    console.log("🔁 Estado actualizado:", isNowFavorite);
}

function updateFavoritesView() {
    document.querySelectorAll(".btn-favorito").forEach((btn) => {
        const productId = btn.dataset.productId;
        const isFav = localStorage.getItem(`favorito-${productId}`) === "true";
        applyFavoriteState(productId, isFav);
    });

    // Si estás en la página de favoritos, muestra mensaje si no hay ninguno
    const container = document.getElementById("favoritos-container");
    if (container) {
        const favoritosActivos = document.querySelectorAll(".product-card .btn-favorito.active");
        if (favoritosActivos.length === 0) {
            container.innerHTML = "<p class='text-center text-gray-500 py-8'>No tienes productos en favoritos.</p>";
        }
    }
}



// --- Lógica de Búsqueda en Vivo ---
const handleLiveSearch = (searchInput, resultsContainer) => {
    let debounceTimer;
    const minLength = 2;

    return async function() {
        const query = searchInput.value.trim();

        clearTimeout(debounceTimer);

        if (query.length < minLength) {
            resultsContainer.innerHTML = '';
            resultsContainer.classList.add('hidden');
            return;
        }

        debounceTimer = setTimeout(async () => {
            try {
                const response = await fetch(`/api/buscar-productos/?q=${encodeURIComponent(query)}`);
                const data = await response.json();

                resultsContainer.innerHTML = '';

                if (data.productos && data.productos.length > 0) {
                    data.productos.forEach(producto => {
                        const resultItem = document.createElement('a');
                        resultItem.href = producto.url;
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
                resultsContainer.innerHTML = `
                    <div class="p-4 text-center text-red-500">
                        Error al cargar resultados. Intenta de nuevo.
                    </div>
                `;
                resultsContainer.classList.remove('hidden');
            }
        }, 300);
    };
};

// =====================================================================
// 🚀 Lógica que se ejecuta cuando el DOM está completamente cargado
// =====================================================================
document.addEventListener("DOMContentLoaded", function () {
    initializeCartDomElements();
    cargarCarritoLocal();
    updateCartDisplay();

    // --- Se elimina toda la lógica duplicada del carrusel de anuncios ---
    // La implementación de carousel.js es ahora la única responsable
    // de esta funcionalidad.

    // --- Inicializar búsqueda en vivo ---
    const searchInputs = document.querySelectorAll('.search-input');
    searchInputs.forEach(searchInput => {
        const resultsContainer = searchInput.closest('form').nextElementSibling;
        if (!resultsContainer || !resultsContainer.classList.contains('search-results')) {
            console.error('No se encontró el contenedor de resultados de búsqueda para este input.');
            return;
        }
        const searchHandler = handleLiveSearch(searchInput, resultsContainer);
        searchInput.addEventListener('input', searchHandler);

        document.addEventListener('click', (e) => {
            if (!searchInput.contains(e.target) && !resultsContainer.contains(e.target)) {
                resultsContainer.classList.add('hidden');
            }
        });

        resultsContainer.addEventListener('click', (e) => {
            e.stopPropagation();
        });
    });

    // --- Otras inicializaciones ---
    setupWhatsappButtons();
    setupColorOptions();
    setupMoreColorsButton();
    setupAddToCartButtons();

    // --- Miniaturas que cambian la imagen principal (detalle de producto) ---
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

    // --- Lógica del menú móvil (Hamburger) ---
    const mobileMenuButton = document.getElementById("mobile-menu-button");
    const mobileMenu = document.getElementById("mobile-menu");
    const mobileCategoriesButton = document.getElementById("mobile-categories-button");
    const mobileCategoriesDropdown = document.getElementById("mobile-categories-dropdown");
    const bottomNavCategoriesButton = document.getElementById("bottom-nav-categories-button");

    if (mobileMenuButton) {
        mobileMenuButton.addEventListener("click", function() {
            mobileMenu.classList.toggle("hidden");
            const mobileSearchBar = document.getElementById('mobile-search-bar');
            if (mobileSearchBar && !mobileSearchBar.classList.contains('hidden')) {
                mobileSearchBar.classList.add('hidden');
            }
        });
    }

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

    if (bottomNavCategoriesButton) {
        bottomNavCategoriesButton.addEventListener('click', function() {
            mobileMenu.classList.remove('hidden');
            if (mobileCategoriesDropdown && mobileCategoriesDropdown.classList.contains('hidden')) {
                mobileCategoriesDropdown.classList.remove('hidden');
                if (mobileCategoriesButton) {
                    mobileCategoriesButton.querySelector('svg').classList.remove('rotate-0');
                    mobileCategoriesButton.querySelector('svg').classList.add('rotate-180');
                }
            }
            const mobileSearchBar = document.getElementById('mobile-search-bar');
            if (mobileSearchBar && !mobileSearchBar.classList.contains('hidden')) {
                mobileSearchBar.classList.add('hidden');
            }
        });
    }

    // --- Lógica para el slider horizontal de productos ---
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

    // --- Lógica para Favoritos ---
    repararFavoritosLocales();
    updateFavoritesView();

    document.addEventListener("click", (event) => {
        const btn = event.target.closest(".btn-favorito");
        if (btn) {
            const productoId = btn.dataset.productId;
            toggleFavorito(btn, productoId);
        }
    });

});
document.addEventListener("click", (event) => {
  const btn = event.target.closest(".btn-favorito");
  if (btn) {
    const productoId = btn.dataset.productId;
    console.log("🧪 Clic en favorito", productoId); // <--- Agregado
    toggleFavorito(btn, productoId);
  }
});
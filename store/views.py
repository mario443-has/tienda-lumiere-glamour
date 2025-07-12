import json # Importa el módulo json
from django.shortcuts import render, get_object_or_404
from django.db.models import Q
from django.views.generic import ListView # Importa ListView
from .models import Categoria, Producto, MenuItem, SiteSetting, Anuncio # Asegúrate de importar Producto y Categoria
from django.http import Http404, JsonResponse # Importa JsonResponse para respuestas JSON
from django.views.decorators.csrf import csrf_exempt # Importa csrf_exempt para deshabilitar CSRF en la vista (solo para pruebas/desarrollo)


def get_common_context():
    """
    Función auxiliar para obtener datos comunes que se usarán en todas las vistas.
    Esto incluye categorías para la navegación (con subcategorías),
    elementos de menú configurables y el número de WhatsApp.
    """
    # Obtener todas las categorías, pre-cargando las subcategorías para evitar consultas N+1.
    # Es crucial que en tu modelo Categoria, el related_name para SubCategoria sea 'subcategorias'
    # o ajusta 'subcategorias' aquí al nombre de tu related_name si es diferente.
    # Usamos el manager personalizado para obtener las categorías principales con conteo de productos
    categorias = Categoria.objects.principales_con_productos()

    # Obtener los elementos de menú configurables desde el modelo MenuItem.
    # Se ordenan por el campo 'order' para controlar su posición en la navegación.
    menu_items = MenuItem.objects.all().order_by('order')

    # Obtener el número de WhatsApp desde el modelo SiteSetting.
    # Si no se encuentra la configuración (por ejemplo, si aún no la has creado en el admin),
    # se usa un número por defecto para evitar errores.
    whatsapp_setting = SiteSetting.objects.filter(key='whatsapp_number').first()
    whatsapp_number_value = whatsapp_setting.value if whatsapp_setting else '573007221200' # Número por defecto

    # Obtener anuncios activos y ordenarlos por el campo 'order'
    anuncios = Anuncio.objects.filter(is_active=True).order_by('order')

    return {
        'categorias_principales': categorias, # Cambiado a categorias_principales para consistencia
        'menu_items': menu_items,
        'whatsapp_number': whatsapp_number_value,
        'anuncios': anuncios, # Añadir anuncios al contexto común
    }

def inicio(request):
    """
    Vista de la página de inicio de Lumière Glamour.
    Maneja la lógica para:
    - Búsqueda de productos por nombre, descripción, categoría o subcategoría.
    - Filtrado de productos por categoría.
    - Filtrado de productos por subcategoría.
    - **Nuevo:** Filtrado de productos en oferta.
    - Pasa datos comunes (categorías, menú, WhatsApp) a la plantilla.
    """
    query = request.GET.get('q') # Obtiene el término de búsqueda de la URL
    categoria_id = request.GET.get('categoria') # Obtiene el ID de la categoría para filtrar
    subcategoria_id = request.GET.get('subcategoria') # Obtiene el ID de la subcategoría para filtrar
    ofertas_activas = request.GET.get('ofertas') # Nuevo: Obtiene el parámetro 'ofertas'

    # Inicia con todos los productos activos.
    # Asume que tu modelo Producto tiene un campo `is_active = models.BooleanField(default=True)`.
    # Si no lo tienes, puedes quitar `.filter(is_active=True)`.
    productos_queryset = Producto.objects.filter(is_active=True)

    nombre_categoria_actual = None # Variable para el título de la sección de productos
    categoria_actual_obj = None # Objeto de la categoría o subcategoría actualmente seleccionada

    # 1. Aplicar filtro de ofertas si se proporciona el parámetro 'ofertas=true'
    if ofertas_activas == 'true':
        productos_queryset = productos_queryset.filter(descuento__gt=0) # Filtra productos con descuento > 0
        # No se establece nombre_categoria_actual aquí, se usará 'Ofertas Especiales' en la plantilla

    # 2. Aplicar filtro de búsqueda si se proporciona un `query`
    if query:
        productos_queryset = productos_queryset.filter(
            Q(nombre__icontains=query) |
            Q(descripcion__icontains=query) |
            Q(categoria__nombre__icontains=query) # Filtra también por nombre de categoría
            # Q(subcategoria__nombre__icontains=query) # Eliminado: la subcategoría ahora es parte de la jerarquía de Categoria
        ).distinct() # `distinct()` para evitar duplicados si un producto coincide en varios campos

    # 3. Aplicar filtro por categoría si se proporciona `categoria_id`
    # Este filtro se aplica DESPUÉS del filtro de ofertas, por si se combinan.
    if categoria_id:
        try:
            categoria_actual_obj = Categoria.objects.get(id=categoria_id)
            productos_queryset = productos_queryset.filter(categoria=categoria_actual_obj)
            nombre_categoria_actual = categoria_actual_obj.nombre
        except Categoria.DoesNotExist:
            # Si la categoría no existe, no se filtra y se mantiene el nombre en None
            pass

    # 4. Aplicar filtro por subcategoría si se proporciona `subcategoria_id`
    # Este filtro se aplica DESPUÉS del filtro de ofertas y categoría.
    # NOTA: Con la nueva estructura de categorías, `subcategoria_id` ahora se refiere a una Categoria
    # que tiene un un `padre`.
    if subcategoria_id:
        try:
            # Busca la subcategoría por su ID
            subcategoria_actual_obj = Categoria.objects.get(id=subcategoria_id)
            # Filtra productos cuya categoría es la subcategoría actual o una de sus subcategorías anidadas
            productos_queryset = productos_queryset.filter(
                Q(categoria=subcategoria_actual_obj) |
                Q(categoria__padre=subcategoria_actual_obj) # Para incluir productos de sub-subcategorías
            ).distinct()

            # Ajusta el título de la sección de productos:
            # Si ya se había filtrado por categoría, combina los nombres.
            # Si no, usa solo el nombre de la subcategoría.
            if nombre_categoria_actual:
                nombre_categoria_actual = f"{subcategoria_actual_obj.nombre} ({nombre_categoria_actual})"
            else:
                nombre_categoria_actual = subcategoria_actual_obj.nombre

            # Establece la categoría padre de la subcategoría como la "actual" para la navegación
            # Esto ayuda a que el elemento de menú de la categoría padre se vea activo.
            if subcategoria_actual_obj.padre:
                categoria_actual_obj = subcategoria_actual_obj.padre # Ahora usamos 'padre' en lugar de 'categoria'

        except Categoria.DoesNotExist: # Ahora se busca en Categoria, no SubCategoria
            # Si la subcategoría no existe, no se filtra
            pass

    # Convertir el QuerySet de productos a una lista de diccionarios
    # para que sea serializable a JSON y pueda ser usada por JavaScript.
    # Aunque el `all_products_data_for_js` no se usa en la plantilla final, se mantiene aquí
    # por si futuras implementaciones de JavaScript lo requieren.
    products_for_js = []
    for producto in productos_queryset:
        products_for_js.append({
            'id': str(producto.id), # Asegúrate de que el ID sea string
            'nombre': producto.nombre,
            'descripcion': producto.descripcion,
            'precio': str(producto.precio), # Convertir Decimal a string
            'descuento': str(producto.descuento), # Convertir Decimal a string
            'get_precio_final': str(producto.get_precio_final()), # Llamar al método y convertir a string
            'imagen': producto.imagen.url if producto.imagen else '', # Obtener la URL de la imagen
        })

    # Obtener el contexto común (categorías, elementos de menú, número de WhatsApp)
    context = get_common_context()

    # Añadir los datos específicos de esta vista al contexto que se pasará a la plantilla
    context.update({
        'productos': productos_queryset, # Mantenemos esto para el bucle principal de la plantilla Django
        # 'all_products_data_for_js': products_for_js, # Esto se pasará al JavaScript vía json_script (se omite si no se usa en plantilla)
        'query': query or '', # Pasa el query para mostrarlo en el título si aplica
        'categoria_actual': categoria_actual_obj.id if categoria_actual_obj else None, # Pasa el ID para el estado 'active' en la navegación
        'nombre_categoria_actual': nombre_categoria_actual, # Pasa el nombre para el título de la sección
        'ofertas_activas': ofertas_activas == 'true', # Pasa un booleano para el estado de ofertas
    })

    # Renderiza la plantilla principal. Asegúrate de que el nombre de la plantilla sea correcto,
    # por ejemplo, 'index.html' si está en la raíz de tu carpeta templates,
    # o 'store/index.html' si está dentro de una subcarpeta 'store'.
    return render(request, 'store/index.html', context)

def producto_detalle(request, producto_id):
    """
    Vista para mostrar los detalles de un producto específico.
    También pasa el contexto común para la barra de navegación y el footer.
    """
    # Obtiene el producto por su ID, o devuelve un 404 si no se encuentra.
    producto = get_object_or_404(Producto, id=producto_id)
    
    # Obtener el contexto común (categorías, elementos de menú, número de WhatsApp)
    context = get_common_context()
    
    # Añadir el producto específico al contexto
    context['producto'] = producto 

    # Renderiza la plantilla de detalle del producto.
    # Asegúrate de que 'store/producto.html' sea la ruta correcta a tu plantilla de detalle.
    return render(request, 'store/producto.html', context)

from django.http import HttpResponse

def google_verification(request):
    return HttpResponse("google-site-verification: google1e60e56990e838db.html", content_type="text/plain")

@csrf_exempt # Solo para desarrollo/pruebas. En producción, deberías usar el token CSRF.
def agregar_al_carrito(request):
    """
    Vista para manejar las peticiones AJAX para añadir productos al carrito.
    """
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            producto_id = data.get('producto_id')
            quantity = data.get('quantity', 1) # Cantidad, por defecto 1
            variant_id = data.get('variant_id') # Si manejas variantes

            # Aquí puedes añadir la lógica para buscar el producto/variante
            # y agregarlo a la sesión del carrito o a la base de datos.
            # Por ahora, solo imprimiremos para verificar.
            print(f"Producto recibido: ID={producto_id}, Cantidad={quantity}, Variante ID={variant_id}")

            # Ejemplo: Guardar en la sesión (esto es una implementación básica)
            if 'cart' not in request.session:
                request.session['cart'] = []
            
            # Para la demostración, solo añadimos el ID y la cantidad.
            # En una aplicación real, buscarías el producto en la DB
            # para obtener su nombre, precio, etc., y lo añadirías al carrito.
            for _ in range(quantity):
                item_to_add = {'id': producto_id, 'variant_id': variant_id if variant_id else producto_id}
                request.session['cart'].append(item_to_add)

            request.session.modified = True # Marca la sesión como modificada para que se guarde

            return JsonResponse({"mensaje": "Producto agregado al carrito", "producto_id": producto_id, "quantity": quantity})
        except json.JSONDecodeError:
            return JsonResponse({"error": "Formato JSON inválido"}, status=400)
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)
    return JsonResponse({"error": "Método no permitido"}, status=405)

# Nueva vista para ver el carrito
def ver_carrito(request):
    """
    Vista para mostrar el contenido del carrito de la sesión.
    """
    carrito = request.session.get('cart', [])
    # Opcional: Si necesitas detalles completos de los productos en el carrito,
    # puedes recuperarlos de la base de datos aquí.
    # Por ejemplo:
    # productos_en_carrito = []
    # for item in carrito:
    #     try:
    #         producto = Producto.objects.get(id=item['id'])
    #         productos_en_carrito.append({
    #             'producto': producto,
    #             'quantity': item.get('quantity', 1),
    #             'variant_id': item.get('variant_id')
    #         })
    #     except Producto.DoesNotExist:
    #         # Manejar el caso donde el producto ya no existe
    #         pass
    # context = get_common_context()
    # context['carrito_detalles'] = productos_en_carrito
    # return render(request, 'store/carrito.html', context)

    # Para una implementación simple, solo pasamos los IDs y variantes guardados en sesión
    context = get_common_context()
    context['carrito'] = carrito
    return render(request, 'store/carrito.html', context)


class CategoriaListView(ListView):
    """
    Vista basada en clase para mostrar productos por categoría.
    """
    model = Producto
    template_name = 'store/categoria.html' # Asegúrate de que esta plantilla exista
    context_object_name = 'productos'
    paginate_by = 12 # Número de productos por página

    def get_queryset(self):
        slug = self.kwargs.get('slug')
        self.categoria = Categoria.objects.filter(slug=slug).first()
        if not self.categoria:
            raise Http404("Categoría no encontrada")

        # Filtra productos que pertenecen a esta categoría o a cualquiera de sus subcategorías
        # Esto es crucial para la nueva estructura jerárquica de categorías
        categorias_a_incluir = [self.categoria]
        # Obtener todas las subcategorías de la categoría actual de forma recursiva
        def get_all_subcategories(category):
            subcategories = []
            for sub in category.subcategorias.all():
                subcategories.append(sub)
                subcategories.extend(get_all_subcategories(sub))
            return subcategories

        categorias_a_incluir.extend(get_all_subcategories(self.categoria))

        return Producto.objects.filter(
            categoria__in=categorias_a_incluir
        ).select_related('categoria')  # Mejora de rendimiento

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['categoria'] = self.categoria
        # Usamos el manager personalizado para obtener las categorías principales con conteo de productos
        context['categorias_principales'] = Categoria.objects.principales_con_productos()
        # Puedes añadir más contexto si lo necesitas, por ejemplo, los anuncios
        context['anuncios'] = Anuncio.objects.filter(is_active=True).order_by('order')
        context.update(get_common_context()) # Asegura que el contexto común esté disponible
        return context
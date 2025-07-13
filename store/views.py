import json # Importa el módulo json
from django.shortcuts import render, get_object_or_404
from django.db.models import Q
from django.views.generic import ListView # Importa ListView
from .models import Categoria, Producto, MenuItem, SiteSetting, Anuncio # Asegúrate de importar Producto y Categoria
from django.http import Http404, JsonResponse, HttpResponse # Importa JsonResponse y HttpResponse para respuestas JSON
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
    # y ahora seleccionamos la imagen_circular
    # CORREGIDO: Eliminado .select_related('imagen_circular') porque no es un campo relacional.
    categorias_principales = Categoria.objects.principales_con_productos()

    # Obtener los elementos de menú configurables desde el modelo MenuItem.
    # Se ordenan por el campo 'order' para controlar su posición en la navegación.
    menu_items = MenuItem.objects.all().order_by('order')

    # Obtener el número de WhatsApp desde SiteSetting
    whatsapp_number = SiteSetting.objects.filter(key='whatsapp_number').first()
    whatsapp_number_value = whatsapp_number.value if whatsapp_number else '573007221200' # Número por defecto si no se encuentra

    return {
        'categorias_principales': categorias_principales, # Cambiado el nombre de la clave
        'menu_items': menu_items,
        'whatsapp_number': whatsapp_number_value,
    }


def inicio(request):
    query = request.GET.get('q')
    ofertas_activas = request.GET.get('ofertas', 'false').lower() == 'true'

    # Pre-carga variaciones y sus imágenes, y las imágenes adicionales del producto
    productos = Producto.objects.filter(is_active=True).select_related('categoria').prefetch_related('variaciones__imagen', 'images')

    if query:
        productos = productos.filter(
            Q(nombre__icontains=query) |
            Q(descripcion__icontains=query) |
            Q(categoria__nombre__icontains=query)
        ).distinct()
    elif ofertas_activas:
        productos = productos.filter(descuento__gt=0)

    context = get_common_context()
    context['productos'] = productos
    context['query'] = query
    context['ofertas_activas'] = ofertas_activas
    context['anuncios'] = Anuncio.objects.filter(is_active=True).order_by('order') # Obtener anuncios
    return render(request, 'store/index.html', context) # CORREGIDO: Ruta de la plantilla


def producto_detalle(request, product_id):
    # Pre-carga variaciones y sus imágenes, y las imágenes adicionales del producto
    producto = get_object_or_404(Producto.objects.prefetch_related('variaciones__imagen', 'images'), pk=product_id)
    context = get_common_context()
    context['producto'] = producto
    return render(request, 'store/producto.html', context) # CORREGIDO: Ruta de la plantilla


def categoria_view(request, slug):
    try:
        categoria = get_object_or_404(Categoria, slug=slug)
    except Http404:
        # Si la categoría no se encuentra por slug, intenta buscar por nombre (opcional, pero útil)
        categoria = get_object_or_404(Categoria, nombre__iexact=slug.replace('-', ' '))

    # Filtrar productos que pertenecen a esta categoría o a cualquiera de sus subcategorías
    categorias_a_incluir = [categoria]
    def get_all_subcategories(cat):
        subcategories = []
        for sub in cat.subcategorias.all():
            subcategories.append(sub)
            subcategories.extend(get_all_subcategories(sub)) # Corregido: Usar 'sub' para la recursión en subcategorías
        return subcategories

    categorias_a_incluir.extend(get_all_subcategories(categoria))

    # Pre-carga variaciones y sus imágenes, y las imágenes adicionales del producto
    productos = Producto.objects.filter(
        categoria__in=categorias_a_incluir,
        is_active=True
    ).select_related('categoria').prefetch_related('variaciones__imagen', 'images')

    context = get_common_context()
    context['categoria_actual'] = categoria
    context['nombre_categoria_actual'] = categoria.nombre
    context['productos'] = productos
    context['anuncios'] = Anuncio.objects.filter(is_active=True).order_by('order') # Obtener anuncios
    return render(request, 'store/categoria.html', context) # CORREGIDO: Ruta de la plantilla


@csrf_exempt # Solo para desarrollo/pruebas, considera usar @require_POST y verificar CSRF en producción
def agregar_al_carrito(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            producto_id = data.get('producto_id')
            quantity = data.get('quantity', 1)
            variant_id = data.get('variant_id')
            color = data.get('color', 'N/A')

            # Aquí podrías añadir lógica para verificar stock, etc.
            # Por ahora, solo confirmamos la recepción.

            return JsonResponse({'mensaje': 'Producto añadido al carrito correctamente.'})
        except json.JSONDecodeError:
            return JsonResponse({'error': 'Formato de solicitud JSON inválido.'}, status=400)
    return JsonResponse({'error': 'Método no permitido.'}, status=405)


class CategoriaListView(ListView):
    model = Producto
    template_name = 'store/index.html'  # CORREGIDO: Ruta de la plantilla (asumiendo que muestra productos como la página de inicio)
    context_object_name = 'productos'
    paginate_by = 10 # Opcional: para paginación

    def get_queryset(self):
        self.slug = self.kwargs['slug']
        try:
            self.categoria = get_object_or_404(Categoria, slug=self.slug)
        except Http404:
            self.categoria = get_object_or_404(Categoria, nombre__iexact=self.slug.replace('-', ' '))

        # Filtrar productos que pertenecen a esta categoría o a cualquiera de sus subcategorías
        # Esto es crucial para la nueva estructura jerárquica de categorías
        categorias_a_incluir = [self.categoria]
        def get_all_subcategories(cat):
            subcategories = []
            for sub in cat.subcategorias.all():
                subcategories.append(sub)
                subcategories.extend(get_all_subcategories(sub)) # Corregido: Usar 'sub' para la recursión
            return subcategories

        categorias_a_incluir.extend(get_all_subcategories(self.categoria))

        # Pre-carga variaciones y sus imágenes, y las imágenes adicionales del producto
        return Producto.objects.filter(
            categoria__in=categorias_a_incluir
        ).select_related('categoria').prefetch_related('variaciones__imagen', 'images')

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['categoria'] = self.categoria
        # Usamos el manager personalizado para obtener las categorías principales con conteo de productos
        context.update(get_common_context()) # Asegura que el contexto común esté disponible
        return context

# Función google_verification restaurada
def google_verification(request):
    return HttpResponse("google-site-verification: google1e60e56990e838db.html", content_type="text/plain")

# Nueva vista para ver el carrito (restaurada)
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
    return render(request, 'store/carrito.html', context) # Asegúrate de tener una plantilla 'store/carrito.html'
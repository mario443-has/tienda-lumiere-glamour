import json # Importa el módulo json
from django.shortcuts import render, get_object_or_404
from django.db.models import Q
# Asegúrate de que todos estos modelos estén definidos en tu models.py
from .models import Producto, Categoria, MenuItem, SiteSetting, SubCategoria


def get_common_context():
    """
    Función auxiliar para obtener datos comunes que se usarán en todas las vistas.
    Esto incluye categorías para la navegación (con subcategorías),
    elementos de menú configurables y el número de WhatsApp.
    """
    # Obtener todas las categorías, pre-cargando las subcategorías para evitar consultas N+1.
    # Es crucial que en tu modelo Categoria, el related_name para SubCategoria sea 'subcategorias'
    # o ajusta 'subcategorias' aquí al nombre de tu related_name si es diferente.
    categorias = Categoria.objects.prefetch_related('subcategorias').all() 
    
    # Obtener los elementos de menú configurables desde el modelo MenuItem.
    # Se ordenan por el campo 'order' para controlar su posición en la navegación.
    menu_items = MenuItem.objects.all().order_by('order')

    # Obtener el número de WhatsApp desde el modelo SiteSetting.
    # Si no se encuentra la configuración (por ejemplo, si aún no la has creado en el admin),
    # se usa un número por defecto para evitar errores.
    whatsapp_setting = SiteSetting.objects.filter(key='whatsapp_number').first()
    whatsapp_number_value = whatsapp_setting.value if whatsapp_setting else '573007221200' # Número por defecto

    return {
        'categorias': categorias,
        'menu_items': menu_items,
        'whatsapp_number': whatsapp_number_value,
    }

def inicio(request):
    """
    Vista de la página de inicio de Lumière Glamour.
    Maneja la lógica para:
    - Búsqueda de productos por nombre, descripción, categoría o subcategoría.
    - Filtrado de productos por categoría.
    - Filtrado de productos por subcategoría.
    - Pasa datos comunes (categorías, menú, WhatsApp) a la plantilla.
    """
    query = request.GET.get('q') # Obtiene el término de búsqueda de la URL
    categoria_id = request.GET.get('categoria') # Obtiene el ID de la categoría para filtrar
    subcategoria_id = request.GET.get('subcategoria') # Obtiene el ID de la subcategoría para filtrar

    # Inicia con todos los productos activos.
    # Asume que tu modelo Producto tiene un campo `is_active = models.BooleanField(default=True)`.
    # Si no lo tienes, puedes quitar `.filter(is_active=True)`.
    productos_queryset = Producto.objects.filter(is_active=True)

    nombre_categoria_actual = None # Variable para el título de la sección de productos
    categoria_actual_obj = None # Objeto de la categoría o subcategoría actualmente seleccionada

    # 1. Aplicar filtro de búsqueda si se proporciona un `query`
    if query:
        productos_queryset = productos_queryset.filter(
            Q(nombre__icontains=query) |
            Q(descripcion__icontains=query) |
            Q(categoria__nombre__icontains=query) | # Filtra también por nombre de categoría
            Q(subcategoria__nombre__icontains=query) # Filtra también por nombre de subcategoría
        ).distinct() # `distinct()` para evitar duplicados si un producto coincide en varios campos

    # 2. Aplicar filtro por categoría si se proporciona `categoria_id`
    if categoria_id:
        try:
            categoria_actual_obj = Categoria.objects.get(id=categoria_id)
            productos_queryset = productos_queryset.filter(categoria=categoria_actual_obj)
            nombre_categoria_actual = categoria_actual_obj.nombre
        except Categoria.DoesNotExist:
            # Si la categoría no existe, no se filtra y se mantiene el nombre en None
            pass 

    # 3. Aplicar filtro por subcategoría si se proporciona `subcategoria_id`
    if subcategoria_id:
        try:
            subcategoria_actual_obj = SubCategoria.objects.get(id=subcategoria_id)
            productos_queryset = productos_queryset.filter(subcategoria=subcategoria_actual_obj)
            
            # Ajusta el título de la sección de productos:
            # Si ya se había filtrado por categoría, combina los nombres.
            # Si no, usa solo el nombre de la subcategoría.
            if nombre_categoria_actual:
                nombre_categoria_actual = f"{subcategoria_actual_obj.nombre} ({nombre_categoria_actual})"
            else:
                nombre_categoria_actual = subcategoria_actual_obj.nombre
            
            # Establece la categoría padre de la subcategoría como la "actual" para la navegación
            # Esto ayuda a que el elemento de menú de la categoría padre se vea activo.
            if subcategoria_actual_obj.categoria:
                categoria_actual_obj = subcategoria_actual_obj.categoria

        except SubCategoria.DoesNotExist:
            # Si la subcategoría no existe, no se filtra
            pass 

    # --- ESTA ES LA PARTE CLAVE PARA SOLUCIONAR EL ERROR (RE-INTEGRADA) ---
    # Convertir el QuerySet de productos a una lista de diccionarios
    # para que sea serializable a JSON y pueda ser usada por JavaScript.
    products_for_js = []
    for producto in productos_queryset:
        products_for_js.append({
            'id': str(producto.id), # Asegúrate de que el ID sea string
            'nombre': producto.nombre,
            'descripcion': producto.descripcion,
            'precio': str(producto.precio), # Convertir Decimal a string
            'descuento': str(producto.descuento), # Convertir Decimal a string
            'get_precio_final': str(producto.get_precio_final), # Llamar al método y convertir a string
            'imagen': producto.imagen.url if producto.imagen else '', # Obtener la URL de la imagen
        })

    # Obtener el contexto común (categorías, elementos de menú, número de WhatsApp)
    context = get_common_context()

    # Añadir los datos específicos de esta vista al contexto que se pasará a la plantilla
    context.update({
        'productos': productos_queryset, # Mantenemos esto para el bucle principal de la plantilla Django
        'all_products_data_for_js': products_for_js, # Esto se pasará al JavaScript vía json_script
        'query': query or '', # Pasa el query para mostrarlo en el título si aplica
        'categoria_actual': categoria_actual_obj.id if categoria_actual_obj else None, # Pasa el ID para el estado 'active' en la navegación
        'nombre_categoria_actual': nombre_categoria_actual, # Pasa el nombre para el título de la sección
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

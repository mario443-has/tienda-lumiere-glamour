import json # Importa el módulo json
from django.shortcuts import render, get_object_or_404
from django.db.models import Q
from django.views.generic import ListView # Importa ListView
from django.core.paginator import Paginator, EmptyPage, PageNotAnInteger
# Asegúrate de importar Producto, Categoria, Variacion y Favorito
from .models import Categoria, Producto, MenuItem, SiteSetting, Anuncio, Variacion, Favorito 
import locale
from decimal import Decimal # Import Decimal para cálculos precisos

def format_precio(precio):
    """
    Formatea un precio en el formato de pesos colombianos
    Ejemplo: 1000 -> $ 1.000
    """
    if precio is None or precio == '':
        return "$ 0"
    
    # Convertir el precio a float si es necesario
    if not isinstance(precio, (int, float, Decimal)): # Añadido Decimal a los tipos
        try:
            precio = float(precio)
        except (ValueError, TypeError):
            return "$ 0"
    
    # Formatear el número con separador de miles
    precio_formateado = "{:,.0f}".format(precio).replace(",", ".")
    
    # Agregar el símbolo de pesos
    return f"$ {precio_formateado}"

from django.http import Http404, JsonResponse
from django.views.decorators.csrf import csrf_exempt
# from django.db.models import Q # Ya importado arriba


def api_buscar_productos(request):
    """
    API endpoint para búsqueda en vivo de productos
    """
    query = request.GET.get('q', '').strip()
    
    if len(query) < 2:
        return JsonResponse({
            'productos': [],
            'mensaje': 'La búsqueda debe tener al menos 2 caracteres.'
        })

    try:
        # Realizar búsqueda en varios campos
        productos = Producto.objects.filter(
            Q(nombre__icontains=query) |
            Q(descripcion__icontains=query) |
            Q(categoria__nombre__icontains=query),
            is_active=True  # Solo productos activos
        ).distinct()[:8]  # Limitar a 8 resultados

        resultados = []
        for producto in productos:
            precio = producto.get_precio_final()
            resultados.append({
                'id': producto.id,
                'nombre': producto.nombre,
                'precio': format_precio(precio),
                'imagen': producto.get_primary_image_url(),
                'url': f'/producto/{producto.id}/',
                'categoria': producto.categoria.nombre if producto.categoria else '',
                'descuento': True if producto.descuento else False
            })

        return JsonResponse({
            'exito': True,
            'productos': resultados,
            'total': len(resultados)
        })

    except Exception as e:
        return JsonResponse({
            'exito': False,
            'error': str(e)
        }, status=500)

def buscar_productos(request):
    """
    Vista para búsqueda en vivo de productos.
    Retorna JSON con los productos que coinciden con la consulta.
    """
    query = request.GET.get('q', '').strip()
    
    if len(query) < 2:  # Requiere al menos 2 caracteres para buscar
        return JsonResponse({
            'productos': [],
            'mensaje': 'Se requieren al menos 2 caracteres para buscar.'
        })

    # Búsqueda en múltiples campos usando Q objects
    productos = Producto.objects.filter(
        Q(nombre__icontains=query) |  # Busca en el nombre
        Q(descripcion__icontains=query) |  # Busca en la descripción
        Q(categoria__nombre__icontains=query)  # Busca en el nombre de la categoría
    ).distinct()[:10]  # Limita a 10 resultados para mejor rendimiento

    # Formatea los resultados
    resultados = []
    for producto in productos:
        resultados.append({
            'id': producto.id,
            'nombre': producto.nombre,
            'precio': format_precio(producto.get_precio_final()),  # Usar el precio con descuento si existe
            'imagen': producto.get_primary_image_url(),  # Usa el método que ya tienes para obtener la imagen
            'url': f'/producto/{producto.id}/',  # URL para el detalle del producto
            'categoria': producto.categoria.nombre if producto.categoria else 'Sin categoría'
        })

    return JsonResponse({
        'productos': resultados,
        'total': len(resultados)
    })


def get_common_context(request): # AHORA RECIBE 'request'
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

   # Obtener los IDs de productos favoritos para la sesión actual
    if not request.session.session_key:
        request.session.save()  # Asegurarse de que exista una clave de sesión

    favoritos_ids = set(
        Favorito.objects.filter(session_key=request.session.session_key)
        .values_list('producto_id', flat=True)
    )

    return {
        'categorias_principales': categorias,
        'menu_items': menu_items,
        'whatsapp_number': whatsapp_number_value,
        'anuncios': anuncios,
        'favoritos_ids': list(favoritos_ids),
    }

def inicio(request):
    """
    Vista de la página de inicio de Lumière Glamour.
    Maneja la lógica para:
    - Búsqueda de productos por nombre, descripción, categoría o subcategoría.
    - Filtrado de productos por categoría.
    - Filtrado de productos por subcategoría.
    - **Nuevo:** Filtrado de productos en oferta.
    - Paginación de productos.
    - Pasa datos comunes (categorías, menú, WhatsApp) a la plantilla.
    """
    query = request.GET.get('q') # Obtiene el término de búsqueda de la URL
    categoria_id = request.GET.get('categoria') # Obtiene el ID de la categoría para filtrar
    subcategoria_id = request.GET.get('subcategoria') # Obtiene el ID de la subcategoría para filtrar
    ofertas_activas = request.GET.get('ofertas') # Nuevo: Obtiene el parámetro 'ofertas'
    page = request.GET.get('page', 1) # Obtiene el número de página, por defecto 1

    # Inicia con todos los productos activos.
    productos_queryset = Producto.objects.filter(is_active=True)

    nombre_categoria_actual = None # Variable para el título de la sección de productos
    categoria_actual_obj = None # Objeto de la categoría o subcategoría actualmente seleccionada

    # 1. Aplicar filtro de ofertas si se proporciona el parámetro 'ofertas=true'
    if ofertas_activas == 'true':
        productos_queryset = productos_queryset.filter(descuento__gt=0) # Filtra productos con descuento > 0
        nombre_categoria_actual = 'Ofertas Especiales'

    # 2. Aplicar filtro de búsqueda si se proporciona un `query`
    if query:
        productos_queryset = productos_queryset.filter(
            Q(nombre__icontains=query) |
            Q(descripcion__icontains=query) |
            Q(categoria__nombre__icontains=query)
        ).distinct()

    # 3. Aplicar filtro por categoría si se proporciona `categoria_id`
    if categoria_id:
        try:
            categoria_actual_obj = Categoria.objects.get(id=categoria_id)
            productos_queryset = productos_queryset.filter(categoria=categoria_actual_obj)
            nombre_categoria_actual = categoria_actual_obj.nombre
        except Categoria.DoesNotExist:
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

    # Configurar la paginación
    paginator = Paginator(productos_queryset, 12)  # 12 productos por página
    
    try:
        productos_paginados = paginator.page(page)
    except PageNotAnInteger:
        productos_paginados = paginator.page(1)
    except EmptyPage:
        productos_paginados = paginator.page(paginator.num_pages)
    
    # Obtener el contexto común
    context = get_common_context(request) # CAMBIO: Pasar request aquí

    # La lógica de favoritos_ids ya se maneja en get_common_context,
    # por lo que no es necesario repetirla aquí.
    # Solo aseguramos que los productos procesados usen el favoritos_ids del contexto común.

    # Procesar los productos para la plantilla
    productos_procesados = []
    for producto in productos_paginados:
        productos_procesados.append({
            'id': producto.id,
            'nombre': producto.nombre,
            'descripcion': producto.descripcion,
            'precio': format_precio(producto.precio),
            'descuento': format_precio(producto.descuento) if producto.descuento else '0',
            'get_precio_final': format_precio(producto.get_precio_final()),
            'imagen': producto.get_primary_image_url(),
            'is_favorito': producto.id in context['favoritos_ids'], # Usar favoritos_ids del contexto común
        })

    # Añadir los datos específicos de esta vista al contexto
    context.update({
        'productos': productos_procesados,
        'pagina_productos': productos_paginados,  # Para acceder a la paginación en la plantilla
        'query': query or '',
        'categoria_actual': categoria_actual_obj.id if categoria_actual_obj else None,
        'nombre_categoria_actual': nombre_categoria_actual or 'Todos los productos',
        'ofertas_activas': ofertas_activas == 'true',
    })

    # Renderizar la plantilla con el contexto actualizado
    return render(request, 'store/index.html', context)

def producto_detalle(request, pk):
    """
    Vista para mostrar los detalles de un producto específico.
    También pasa el contexto común para la barra de navegación y el footer.
    """
    # Obtiene el producto por su ID, o devuelve un 404 si no se encuentra.
    producto = get_object_or_404(Producto, pk=pk)
    
    # Obtener el contexto común
    common_context = get_common_context(request) # CAMBIO: Pasar request aquí
    
    # Añadir el producto específico al contexto
    context = {
        "producto": producto,
        # Determinar si el producto específico es favorito
        "is_favorito": producto.id in common_context['favoritos_ids'], # Usar favoritos_ids del contexto común
    }
    context.update(common_context) # Fusionar el contexto común con el contexto específico
    
    # Obtener las variaciones del producto
    variaciones = producto.variaciones.all() # Corrected: use related_name 'variaciones'
    
    # Preparar las variaciones para el contexto
    context['variaciones'] = [{
        'id': var.id,
        'tono': var.tono,
        'color_hex': var.color_hex,
        'imagen': var.imagen.url if var.imagen else '',
        'precio_formateado': format_precio(var.precio_final) # Use var.precio_final
    } for var in variaciones]

    # Renderiza la plantilla de detalle del producto.
    # Asegúrate de que 'store/producto.html' sea la ruta correcta a tu plantilla de detalle.
    return render(request, 'store/producto.html', context)

from django.http import HttpResponse

def google_verification(request):
    return HttpResponse("google-site-verification: google1e60e56990e838db.html", content_type="text/plain")

@csrf_exempt
def toggle_favorito(request):
    """
    Vista para añadir o quitar un producto de favoritos (basado en session_key).
    """
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            producto_id = data.get('producto_id')
            
            if not producto_id:
                return JsonResponse({'error': 'ID de producto no proporcionado'}, status=400)
            
            # Asegurar que la sesión exista
            if not request.session.session_key:
                request.session.save()
                
            session_key = request.session.session_key
            
            # Verificar si ya existe el favorito
            favorito, created = Favorito.objects.get_or_create(
                session_key=session_key,
                producto_id=producto_id
            )
            
            if not created:
                favorito.delete()
                return JsonResponse({
                    'mensaje': 'Producto eliminado de favoritos',
                    'is_favorito': False
                })
            else:
                return JsonResponse({
                    'mensaje': 'Producto añadido a favoritos',
                    'is_favorito': True
                })
                
        except json.JSONDecodeError:
            return JsonResponse({'error': 'Formato JSON inválido'}, status=400)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)
            
    return JsonResponse({'error': 'Método no permitido'}, status=405)

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
            color = data.get('color') # Nuevo: Obtener el color de la variante

            # Recuperar el producto y la variante
            producto = get_object_or_404(Producto, id=producto_id)
            variante = None
            if variant_id and str(variant_id) != str(producto_id): # Verifica si variant_id es diferente de product_id
                variante = get_object_or_404(Variacion, id=variant_id, producto=producto)

            # Preparar el item para el carrito de sesión
            item_to_add = {
                'id': producto.id,
                'name': producto.nombre,
                'price': float(variante.precio_final) if variante else float(producto.get_precio_final()),
                'quantity': int(quantity),
                'variant_id': variante.id if variante else producto.id,
                'color': variante.color if variante else color, # Preferir el color de la variante, si no, usar el color pasado
                'imageUrl': variante.imagen.url if variante and variante.imagen else producto.get_primary_image_url(),
            }

            if 'cart' not in request.session:
                request.session['cart'] = []
            
            # Verificar si el item ya existe en el carrito (por variant_id)
            found = False
            for item in request.session['cart']:
                if item.get('variant_id') == item_to_add['variant_id']:
                    item['quantity'] += item_to_add['quantity']
                    found = True
                    break
            
            if not found:
                request.session['cart'].append(item_to_add)

            request.session.modified = True # Marca la sesión como modificada para que se guarde

            return JsonResponse({"mensaje": "Producto agregado al carrito", "producto_id": producto_id, "quantity": quantity})
        except json.JSONDecodeError:
            return JsonResponse({"error": "Formato JSON inválido"}, status=400)
        except Producto.DoesNotExist:
            return JsonResponse({"error": "Producto no encontrado"}, status=404)
        except Variacion.DoesNotExist:
            return JsonResponse({"error": "Variación no encontrada para el producto"}, status=404)
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)
    return JsonResponse({"error": "Método no permitido"}, status=405)

# Nueva vista para ver el carrito
def ver_carrito(request):
    """
    Vista para mostrar el contenido del carrito de la sesión con detalles completos.
    """
    raw_cart = request.session.get('cart', [])
    productos_carrito_detalles = []

    for item in raw_cart:
        try:
            # Asegúrate de que los campos necesarios existen en el item del carrito
            producto_id = item.get('id')
            variant_id = item.get('variant_id')
            quantity = item.get('quantity', 1)
            item_color = item.get('color', 'N/A') # Obtener el color del item del carrito

            if not producto_id:
                continue # Saltar si falta el ID del producto

            producto = get_object_or_404(Producto, id=producto_id)
            variante = None
            
            # Si hay un variant_id y es diferente al producto_id (indicando que es una variación real)
            if variant_id and str(variant_id) != str(producto_id):
                variante = Variacion.objects.filter(id=variant_id, producto=producto).first()
            
            # Determinar el precio y la imagen final
            final_price = variante.precio_final if variante else producto.get_precio_final()
            image_url = variante.imagen.url if variante and variante.imagen else producto.get_primary_image_url()
            
            # Calcular el subtotal aquí
            subtotal_item = final_price * Decimal(quantity) # Usar Decimal para cálculos precisos
            
            productos_carrito_detalles.append({
                'id': producto.id,
                'name': producto.nombre,
                'price': float(final_price), # Asegurarse de que sea float para JS
                'quantity': int(quantity),
                'variant_id': variante.id if variante else producto.id,
                'color': variante.color if variante else item_color, # Preferir el color de la variante, si no, usar el color del item
                'imageUrl': image_url,
                'price_formatted': format_precio(final_price), # Precio formateado para mostrar
                'subtotal': float(subtotal_item) # Añadir el subtotal aquí
            })
        except Producto.DoesNotExist:
            # Puedes añadir lógica para limpiar el carrito si un producto ya no existe
            print(f"Producto con ID {item.get('id')} no encontrado en la DB. Eliminando del carrito de sesión.")
            # Opcional: request.session['cart'].remove(item) - Requiere manejo cuidadoso de iteración
            pass # Continúa con el siguiente item si el producto no existe
        except Variacion.DoesNotExist:
            print(f"Variación con ID {item.get('variant_id')} no encontrada para el producto {item.get('id')}. Continua.")
            pass
        except Exception as e:
            print(f"Error procesando item del carrito: {e}")
            pass

    context = get_common_context(request) # CAMBIO: Pasar request aquí
    context['carrito_detalles'] = productos_carrito_detalles # Renombrado para claridad
    return render(request, 'store/carrito.html', context)


class CategoriaListView(ListView):
    """
    Vista basada en clase para mostrar productos por categoría.
    """
    model = Producto
    template_name = 'store/categoria.html'
    context_object_name = 'productos'
    paginate_by = 12

    def get_queryset(self):
        slug = self.kwargs.get('slug')
        self.categoria = Categoria.objects.filter(slug=slug).first()
        if not self.categoria:
            raise Http404("Categoría no encontrada")

        # Filtra productos que pertenecen a esta categoría o a cualquiera de sus subcategorías
        categorias_a_incluir = [self.categoria]
        
        def get_all_subcategories(category):
            subcategories = []
            for sub in category.subcategorias.all():
                subcategories.append(sub)
                subcategories.extend(get_all_subcategories(sub))
            return subcategories

        categorias_a_incluir.extend(get_all_subcategories(self.categoria))

        # Filtra solo productos activos y ordena por fecha de creación
        return Producto.objects.filter(
            categoria__in=categorias_a_incluir,
            is_active=True
        ).select_related('categoria').order_by('-fecha_creacion')

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['categoria'] = self.categoria
        context.update(get_common_context(self.request)) # CAMBIO: Pasar self.request aquí
        
        # Obtener los productos paginados
        productos_paginados = context['productos']
        
        # La lógica de favoritos_ids ya se maneja en get_common_context,
        # por lo que no es necesario repetirla aquí.
        # Solo aseguramos que los productos procesados usen el favoritos_ids del contexto común.
        
        # Procesar los productos para la plantilla
        productos_procesados = []
        for producto in productos_paginados:
            productos_procesados.append({
                'id': producto.id,
                'nombre': producto.nombre,
                'descripcion': producto.descripcion,
                'precio': format_precio(producto.precio),
                'descuento': format_precio(producto.descuento) if producto.descuento else '0',
                'get_precio_final': format_precio(producto.get_precio_final()),
                'imagen': producto.get_primary_image_url(),
                'is_favorito': producto.id in context['favoritos_ids'], # Usar favoritos_ids del contexto común
            })
        
        # Actualizar el contexto con los productos procesados
        context['productos_procesados'] = productos_procesados
        context['pagina_productos'] = productos_paginados
        
        return context
def ver_favoritos(request):
    """
    Vista para mostrar todos los productos favoritos
    """
    context = get_common_context(request)
    
    favoritos_productos = []
    if request.session.session_key:
        favoritos_productos = Producto.objects.filter(
            favoritos__session_key=request.session.session_key,
            is_active=True
        )
    
    productos_procesados = []
    for producto in favoritos_productos:
        productos_procesados.append({
            'id': producto.id,
            'nombre': producto.nombre,
            'descripcion': producto.descripcion,
            'precio': format_precio(producto.precio),
            'descuento': format_precio(producto.descuento) if producto.descuento else '0',
            'get_precio_final': format_precio(producto.get_precio_final()),
            'imagen': producto.get_primary_image_url(),
            'is_favorito': producto.id in favoritos_ids,
        })

    context['favoritos_productos'] = productos_procesados
    return render(request, 'store/favoritos.html', context)

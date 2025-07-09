from django.contrib import admin
# Asegúrate de que todos estos modelos estén importados correctamente desde tu models.py
from .models import Categoria, SubCategoria, Producto, Variacion, MenuItem, SiteSetting, ProductImage, Anuncio

# Inline para ProductImage: permite añadir y editar imágenes de un producto
# directamente desde la página de edición del producto en el admin.
class ProductImageInline(admin.TabularInline):
    model = ProductImage
    extra = 1 # Muestra 1 formulario vacío por defecto para añadir una nueva imagen
    fields = ['image', 'alt_text', 'order'] # Campos a mostrar en el inline

# Inline para Variacion: permite añadir y editar variaciones de un producto
# directamente desde la página de edición del producto en el admin.
class VariacionInline(admin.TabularInline):
    model = Variacion
    extra = 1 # Muestra 1 formulario vacío por defecto para añadir una nueva variación
    fields = ['nombre', 'valor', 'color', 'tono', 'presentacion'] # Campos a mostrar en el inline

# Admin de Categoría
@admin.register(Categoria)
class CategoriaAdmin(admin.ModelAdmin):
    list_display = ('nombre', 'slug',) 
    search_fields = ('nombre',)
    prepopulated_fields = {'slug': ('nombre',)} 

# Admin de SubCategoría
@admin.register(SubCategoria)
class SubCategoriaAdmin(admin.ModelAdmin):
    list_display = ('nombre', 'categoria', 'slug',) 
    list_filter = ('categoria',)
    search_fields = ('nombre',)
    prepopulated_fields = {'slug': ('nombre',)} 

# Admin de Producto
@admin.register(Producto)
class ProductoAdmin(admin.ModelAdmin):
    list_display = ('nombre', 'precio', 'descuento', 'get_precio_final', 'categoria', 'subcategoria', 'is_active', 'stock') 
    list_filter = ('categoria', 'subcategoria', 'is_active')
    search_fields = ('nombre', 'descripcion', 'long_description') # Añadido long_description a la búsqueda
    prepopulated_fields = {'slug': ('nombre',)} 
    
    # CORRECCIÓN: date_hierarchy ahora apunta a 'fecha_creacion'
    # Esto resuelve el SystemCheckError que estabas viendo.
    date_hierarchy = 'fecha_creacion' 

    # Añade los inlines para que ProductImage y Variacion se puedan gestionar desde el Producto
    inlines = [ProductImageInline, VariacionInline] 

    # Organiza los campos en el formulario de edición del producto en el admin
    fieldsets = (
        (None, {
            'fields': ('nombre', 'slug', 'categoria', 'subcategoria', 'is_active', 'stock', 'imagen')
        }),
        ('Precios y Descuentos', {
            'fields': ('precio', 'descuento')
        }),
        ('Descripciones', {
            'fields': ('descripcion', 'long_description') # Ambos campos de descripción
        }),
    )

# Admin de Menú
@admin.register(MenuItem)
class MenuItemAdmin(admin.ModelAdmin):
    list_display = ('nombre', 'url', 'order')
    list_editable = ('url', 'order') # Permite editar URL y orden directamente desde la lista

# Admin de Configuración del sitio
@admin.register(SiteSetting)
class SiteSettingAdmin(admin.ModelAdmin):
    list_display = ('key', 'value')
    list_editable = ('value',) # Permite editar el valor directamente desde la lista
    search_fields = ('key',) # Mantenemos tu campo de búsqueda

# NUEVO: Admin para el modelo Anuncio
@admin.register(Anuncio)
class AnuncioAdmin(admin.ModelAdmin):
    list_display_links = ('fecha_creacion',)
    list_display = ('is_active', 'order', 'url', 'fecha_creacion')
    list_filter = ('is_active',)
    list_editable = ('is_active', 'order', 'url') # Permite editar estos campos directamente en la lista
    date_hierarchy = 'fecha_creacion' # Para navegación por fechas en el admin
    fields = ('imagen', 'url', 'is_active', 'order')  # ✅ Solo muestra estos campos
from django.contrib import admin
# Asegúrate de que todos estos modelos estén importados correctamente desde tu models.py
# Eliminado SubCategoria ya que ahora Categoria maneja la jerarquía
from .models import Categoria, Producto, Variacion, MenuItem, SiteSetting, ProductImage, Anuncio

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
    # Campos a mostrar en el inline, ahora incluyendo los nuevos campos de imagen y precio
    fields = ['nombre', 'valor', 'color', 'color_hex', 'tono', 'presentacion', 'imagen', 'price_override']

# Admin de Categoría (ahora con soporte para jerarquía)
@admin.register(Categoria)
class CategoriaAdmin(admin.ModelAdmin):
    # Añadido 'padre' y 'descripcion' para visualizar la jerarquía y el nuevo campo
    list_display = ('nombre', 'slug', 'padre', 'descripcion', 'fecha_creacion', 'fecha_modificacion')
    search_fields = ('nombre', 'descripcion')
    prepopulated_fields = {'slug': ('nombre',)}
    # Permite filtrar por categoría padre
    list_filter = ('padre',)
    # Organiza los campos en el formulario de edición de Categoría
    fieldsets = (
        (None, {
            'fields': ('nombre', 'slug', 'descripcion', 'padre')
        }),
    )

# Eliminado el Admin de SubCategoría ya que el modelo SubCategoria fue eliminado.
# @admin.register(SubCategoria)
# class SubCategoriaAdmin(admin.ModelAdmin):
#     list_display = ('nombre', 'categoria', 'slug',)
#     list_filter = ('categoria',)
#     search_fields = ('nombre',)
#     prepopulated_fields = {'slug': ('nombre',)}

# Admin de Producto
@admin.register(Producto)
class ProductoAdmin(admin.ModelAdmin):
    # Eliminado 'subcategoria' de list_display
    list_display = ('nombre', 'precio', 'descuento', 'get_precio_final', 'categoria', 'is_active', 'stock')
    # Eliminado 'subcategoria' de list_filter
    list_filter = ('categoria', 'is_active')
    search_fields = ('nombre', 'descripcion', 'long_description')
    prepopulated_fields = {'slug': ('nombre',)}

    # date_hierarchy ahora apunta a 'fecha_creacion'
    date_hierarchy = 'fecha_creacion'

    # Añade los inlines para que ProductImage y Variacion se puedan gestionar desde el Producto
    inlines = [ProductImageInline, VariacionInline]

    # Organiza los campos en el formulario de edición del producto en el admin
    fieldsets = (
        (None, {
            # Eliminado 'subcategoria' de fields
            'fields': ('nombre', 'slug', 'categoria', 'is_active', 'stock', 'imagen')
        }),
        ('Precios y Descuentos', {
            'fields': ('precio', 'descuento')
        }),
        ('Descripciones', {
            'fields': ('descripcion', 'long_description')
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
    list_editable = ('value',)
    search_fields = ('key',)

# Admin para el modelo Anuncio
@admin.register(Anuncio)
class AnuncioAdmin(admin.ModelAdmin):
    list_display_links = ('fecha_creacion',)
    # Asegúrate de que 'titulo' esté en el modelo Anuncio
    list_display = ('titulo', 'is_active', 'order', 'url', 'fecha_creacion')
    list_filter = ('is_active',)
    list_editable = ('is_active', 'order', 'url')
    # date_hierarchy ahora apunta a 'fecha_creacion'
    date_hierarchy = 'fecha_creacion'
    # Asegúrate de que 'titulo' esté en los campos
    fields = ('titulo', 'imagen', 'url', 'is_active', 'order')
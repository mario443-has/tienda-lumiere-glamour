from django.contrib import admin
from django.utils.html import format_html

from .models import (Anuncio, Categoria, MenuItem, ProductImage, Producto,
                     SiteSetting, Variacion)


# Admin para Categoria
class CategoriaAdmin(admin.ModelAdmin):
    list_display = (
        "nombre",
        "slug",
        "padre",
        "num_productos",
        "imagen_circular_preview",
    )
    prepopulated_fields = {"slug": ("nombre",)}
    search_fields = ("nombre", "descripcion")
    list_filter = ("padre",)
    ordering = ("nombre",)

    # NUEVO: Añadimos una propiedad para mostrar el conteo de productos en list_display
    # Asegúrate de que este método 'num_productos' coincida con la anotación de tu manager.
    def num_productos(self, obj):
        # Intentamos acceder al atributo num_productos si está anotado.
        # Si no, caemos de vuelta al conteo directo.
        return getattr(obj, "_num_productos", obj.productos.count())

    num_productos.short_description = "Nº Productos"  # Nombre de la columna en el admin

    # NUEVO: Propiedad para la vista previa de la imagen circular en el admin
    def imagen_circular_preview(self, obj):
        if obj.imagen_circular:
            return format_html(
                '<img src="{}" width="50" height="50" style="border-radius: 50%;" />',
                obj.imagen_circular.url,
            )
        return "No Image"

    imagen_circular_preview.short_description = (
        "Imagen Circular"  # Nombre de la columna
    )

    # Opcional: Define los campos a mostrar en el formulario de edición
    fieldsets = (
        (
            None,
            {
                "fields": (
                    "nombre",
                    "descripcion",
                    "slug",
                    "padre",
                    "imagen_circular",
                    "imagen_circular_preview",
                )
            },
        ),
    )
    readonly_fields = (
        "imagen_circular_preview",
    )  # Hace que la vista previa sea de solo lectura


admin.site.register(Categoria, CategoriaAdmin)


# Inline para ProductImage (usado en ProductoAdmin)
class ProductImageInline(admin.TabularInline):
    model = ProductImage
    extra = 1
    fields = ("image", "alt_text", "order", "image_preview")
    readonly_fields = ("image_preview",)

    def image_preview(self, obj):
        if obj.image:
            return format_html(
                '<img src="{}" width="100" height="100" />', obj.image.url
            )
        return "No Image"

    image_preview.short_description = "Preview"


# Inline para Variacion (usado en ProductoAdmin)
class VariacionInline(admin.TabularInline):
    model = Variacion
    extra = 1
    fields = (
        "nombre",
        "valor",
        "color",
        "color_hex",
        "tono",
        "presentacion",
        "price_override",
        "imagen",
        "imagen_preview",
    )
    readonly_fields = ("imagen_preview",)

    def imagen_preview(self, obj):
        if obj.imagen:
            return format_html(
                '<img src="{}" width="50" height="50" />', obj.imagen.url
            )
        return "No Image"

    imagen_preview.short_description = "Preview"


# Admin para Producto (definición única y completa)
class ProductoAdmin(admin.ModelAdmin):
    list_display = (
        "nombre",
        "categoria",
        "precio",
        "descuento",
        "is_active",
        "stock",
        "fecha_creacion",
    )
    prepopulated_fields = {"slug": ("nombre",)}
    search_fields = ("nombre", "descripcion", "categoria__nombre")
    list_filter = ("is_active", "categoria")
    inlines = [ProductImageInline, VariacionInline]  # Incluye ambos inlines
    date_hierarchy = "fecha_creacion"
    ordering = ("-fecha_creacion",)
    fieldsets = (  # Puedes mantener o ajustar los fieldsets según tus necesidades
        (
            "Información Básica",
            {
                "fields": (
                    "nombre",
                    "slug",
                    "descripcion",
                    "long_description",
                    "categoria",
                )
            },
        ),
        ("Precios y Stock", {"fields": ("precio", "descuento", "stock")}),
        (
            "Estado y Etiqueta",
            {
                "fields": (
                    "is_active",
                    "badge",
                ),  # ✅ CORREGIDO: 'etiqueta' cambiado a 'badge'
                "description": "Define si el producto está activo y su etiqueta principal",
            },
        ),
        (
            "Imagen Principal",
            {
                "fields": (
                    "imagen",
                )  # Asegúrate de que 'imagen' está en tu modelo Producto
            },
        ),
    )


admin.site.register(Producto, ProductoAdmin)


# Admin para MenuItem
class MenuItemAdmin(admin.ModelAdmin):
    list_display = ("nombre", "url", "order")
    list_editable = ("url", "order")  # Permite editar directamente desde la lista
    ordering = ("order",)


admin.site.register(MenuItem, MenuItemAdmin)


# Admin para SiteSetting
class SiteSettingAdmin(admin.ModelAdmin):
    list_display = ("key", "value")
    list_editable = ("value",)  # Permite editar directamente desde la lista
    search_fields = ("key", "value")
    ordering = ("key",)


admin.site.register(SiteSetting, SiteSettingAdmin)


# Admin para Anuncio
class AnuncioAdmin(admin.ModelAdmin):
    list_display = ("titulo", "is_active", "order", "fecha_creacion", "anuncio_preview")
    list_editable = ("is_active", "order")
    search_fields = ("titulo", "descripcion")
    list_filter = ("is_active",)
    ordering = ("order", "-fecha_creacion")

    def anuncio_preview(self, obj):
        if obj.imagen:
            return format_html(
                '<img src="{}" width="100" height="auto" />', obj.imagen.url
            )
        return "No Image"

    anuncio_preview.short_description = "Preview"

    fieldsets = (
        (
            None,
            {
                "fields": (
                    "titulo",
                    "descripcion",
                    "imagen",
                    "anuncio_preview",
                    "url",
                    "is_active",
                    "order",
                )
            },
        ),
    )
    readonly_fields = (
        "anuncio_preview",
    )  # Hace que la vista previa sea de solo lectura


admin.site.register(Anuncio, AnuncioAdmin)

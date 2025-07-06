from django.contrib import admin
from .models import Categoria, Producto, Variacion

# Opcional: personalizar cómo se ven los productos en el admin
class ProductoAdmin(admin.ModelAdmin):
    list_display = ('nombre', 'precio', 'descuento', 'categoria')
    list_filter = ('categoria',)
    search_fields = ('nombre',)

class VariacionAdmin(admin.ModelAdmin):
    list_display = ('producto', 'color', 'tono', 'presentacion')
    list_filter = ('producto',)
    search_fields = ('producto__nombre',)

# Registro de modelos en el admin
admin.site.register(Categoria)
admin.site.register(Producto, ProductoAdmin)
admin.site.register(Variacion, VariacionAdmin)

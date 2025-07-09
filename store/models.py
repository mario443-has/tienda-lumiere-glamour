from django.db import models
from django.utils.text import slugify
from decimal import Decimal
from ckeditor.fields import RichTextField # ¡IMPORTANTE: Asegúrate de tener ckeditor instalado y configurado!

class Categoria(models.Model):
    nombre = models.CharField(max_length=100, unique=True)
    slug = models.SlugField(unique=True, blank=True)

    class Meta:
        verbose_name = "Categoría" # Mejorado para singular
        verbose_name_plural = "Categorías" # Mejorado para plural

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.nombre)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.nombre

class SubCategoria(models.Model):
    categoria = models.ForeignKey(Categoria, related_name='subcategorias', on_delete=models.CASCADE)
    nombre = models.CharField(max_length=100) # Eliminado unique=True aquí, ya que el unique_together lo maneja
    slug = models.SlugField(unique=True, blank=True)
    
    class Meta:
        verbose_name = "Subcategoría" # Mejorado para singular
        verbose_name_plural = "Subcategorías" # Mejorado para plural
        unique_together = ('categoria', 'nombre') # Asegura que la subcategoría sea única DENTRO de una categoría

    def save(self, *args, **kwargs):
        if not self.slug:
            # Genera un slug que incluya el nombre de la categoría para mayor unicidad
            self.slug = slugify(f"{self.categoria.nombre}-{self.nombre}")
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.nombre} ({self.categoria.nombre})"

class Producto(models.Model):
    nombre = models.CharField(max_length=200)
    slug = models.SlugField(unique=True, blank=True)
    descripcion = models.TextField(blank=True, null=True) # Descripción corta
    # NUEVO: Campo para la descripción larga con CKEditor
    long_description = RichTextField(blank=True, null=True, verbose_name="Descripción Larga (con formato)")
    precio = models.DecimalField(max_digits=10, decimal_places=2)
    descuento = models.DecimalField(max_digits=5, decimal_places=2, default=0.00, help_text="Porcentaje de descuento (ej. 0.10 para 10%)")
    imagen = models.ImageField(upload_to='productos/', blank=True, null=True) # Imagen principal
    categoria = models.ForeignKey(Categoria, on_delete=models.SET_NULL, null=True, blank=True)
    subcategoria = models.ForeignKey(SubCategoria, on_delete=models.SET_NULL, null=True, blank=True)
    is_active = models.BooleanField(default=True)
    fecha_creacion = models.DateTimeField(auto_now_add=True) # Renombrado de created_at
    ultima_actualizacion = models.DateTimeField(auto_now=True) # Renombrado de updated_at
    stock = models.IntegerField(default=0) # Tu campo stock

    class Meta:
        verbose_name = "Producto"
        verbose_name_plural = "Productos"
        ordering = ['-fecha_creacion'] # Ordena por fecha de creación

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.nombre)
        super().save(*args, **kwargs)

    def get_precio_final(self):
        """Calcula el precio final aplicando el descuento."""
        # Usamos Decimal para asegurar cálculos precisos con dinero
        precio_decimal = Decimal(self.precio)
        descuento_decimal = Decimal(self.descuento)
        
        if descuento_decimal > 0 and descuento_decimal <= 1: # Asegura que el descuento sea un porcentaje válido
            return precio_decimal * (1 - descuento_decimal)
        return precio_decimal

    def __str__(self):
        return self.nombre

# NUEVO: Modelo para imágenes adicionales del producto
class ProductImage(models.Model):
    producto = models.ForeignKey(Producto, related_name='images', on_delete=models.CASCADE)
    image = models.ImageField(upload_to='productos/galeria/')
    alt_text = models.CharField(max_length=255, blank=True, help_text="Texto alternativo para la imagen (SEO y accesibilidad)")
    order = models.IntegerField(default=0, help_text="Orden de visualización de la imagen")

    class Meta:
        verbose_name = "Imagen de Producto"
        verbose_name_plural = "Imágenes de Productos"
        ordering = ['order'] # Ordena las imágenes por su campo 'order'

    def __str__(self):
        return f"Imagen para {self.producto.nombre} (Orden: {self.order})"

# Modelo de Variación (Mantenido de tu código)
class Variacion(models.Model):
    producto = models.ForeignKey(Producto, on_delete=models.CASCADE, related_name='variaciones')
    nombre = models.CharField(max_length=100)  # Ej: "Talla", "Color"
    valor = models.CharField(max_length=100)
    color = models.CharField(max_length=50, blank=True, null=True)
    tono = models.CharField(max_length=50, blank=True, null=True)
    presentacion = models.CharField(max_length=50, blank=True, null=True)

    class Meta:
        unique_together = ('producto', 'nombre', 'valor') 
        verbose_name = "Variación" # Mejorado
        verbose_name_plural = "Variaciones" # Mejorado

    def __str__(self):
        return f"{self.producto.nombre} - {self.nombre}: {self.valor}"

class MenuItem(models.Model):
    nombre = models.CharField(max_length=100)
    url = models.CharField(max_length=255, help_text="URL a la que apunta el elemento de menú") # Cambiado a CharField y max_length a 255
    order = models.IntegerField(default=0, help_text="Orden de aparición en el menú")

    class Meta:
        verbose_name = "Elemento de Menú" # Mejorado
        verbose_name_plural = "Elementos de Menú" # Mejorado
        ordering = ['order']

    def __str__(self):
        return self.nombre

class SiteSetting(models.Model):
    key = models.CharField(max_length=100, unique=True, help_text="Clave de la configuración (ej. 'whatsapp_number')")
    value = models.CharField(max_length=255, help_text="Valor de la configuración")

    class Meta:
        verbose_name = "Configuración del Sitio" # Mejorado
        verbose_name_plural = "Configuraciones del Sitio" # Mejorado

    def __str__(self):
        return f"{self.key}: {self.value}"

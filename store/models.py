from django.db import models
from django.utils.text import slugify
from decimal import Decimal
from ckeditor.fields import RichTextField
from cloudinary.models import CloudinaryField

class Categoria(models.Model):
    nombre = models.CharField(max_length=100, unique=True)
    slug = models.SlugField(unique=True, blank=True)

    class Meta:
        verbose_name = "Categoría"
        verbose_name_plural = "Categorías"

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.nombre)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.nombre

class SubCategoria(models.Model):
    categoria = models.ForeignKey(Categoria, related_name='subcategorias', on_delete=models.CASCADE)
    nombre = models.CharField(max_length=100)
    slug = models.SlugField(unique=True, blank=True)
    
    class Meta:
        verbose_name = "Subcategoría"
        verbose_name_plural = "Subcategorías"
        unique_together = ('categoria', 'nombre')

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(f"{self.categoria.nombre}-{self.nombre}")
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.nombre} ({self.categoria.nombre})"

class Producto(models.Model):
    nombre = models.CharField(max_length=200)
    slug = models.SlugField(unique=True, blank=True)
    descripcion = models.TextField(blank=True, null=True)
    long_description = RichTextField(blank=True, null=True, verbose_name="Descripción Larga (con formato)")
    precio = models.DecimalField(max_digits=10, decimal_places=2)
    descuento = models.DecimalField(max_digits=5, decimal_places=2, default=0.00, help_text="Porcentaje de descuento (ej. 0.10 para 10%)")
    imagen = CloudinaryField('imagen', blank=True, null=True)
    categoria = models.ForeignKey(Categoria, on_delete=models.SET_NULL, null=True, blank=True)
    subcategoria = models.ForeignKey(SubCategoria, on_delete=models.SET_NULL, null=True, blank=True)
    is_active = models.BooleanField(default=True)
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    ultima_actualizacion = models.DateTimeField(auto_now=True)
    stock = models.IntegerField(default=0)

    class Meta:
        verbose_name = "Producto"
        verbose_name_plural = "Productos"
        ordering = ['-fecha_creacion']

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.nombre)
        super().save(*args, **kwargs)

    def get_precio_final(self):
        precio_decimal = Decimal(self.precio)
        descuento_decimal = Decimal(self.descuento)
        if descuento_decimal > 0 and descuento_decimal <= 1:
            return precio_decimal * (1 - descuento_decimal)
        return precio_decimal

    def __str__(self):
        return self.nombre

class ProductImage(models.Model):
    producto = models.ForeignKey(Producto, related_name='images', on_delete=models.CASCADE)
    image = CloudinaryField('imagen', blank=True, null=True)
    alt_text = models.CharField(max_length=255, blank=True, help_text="Texto alternativo para la imagen")
    order = models.IntegerField(default=0, help_text="Orden de visualización de la imagen")

    class Meta:
        verbose_name = "Imagen de Producto"
        verbose_name_plural = "Imágenes de Productos"
        ordering = ['order']

    def __str__(self):
        return f"Imagen para {self.producto.nombre} (Orden: {self.order})"

class Variacion(models.Model):
    producto = models.ForeignKey(Producto, on_delete=models.CASCADE, related_name='variaciones')
    nombre = models.CharField(max_length=100)
    valor = models.CharField(max_length=100)
    color = models.CharField(max_length=50, blank=True, null=True)
    color_hex = models.CharField(max_length=7, blank=True, null=True, help_text="Código HEX del color (ej. #FF0000)") # ✅ Añadido
    tono = models.CharField(max_length=50, blank=True, null=True)
    presentacion = models.CharField(max_length=50, blank=True, null=True)
    imagen = CloudinaryField('imagen_variacion', blank=True, null=True, help_text="Imagen específica para esta variación") # ✅ Añadido
    price_override = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True, help_text="Opcional: Precio para esta variación. Si está vacío, usa el precio del producto principal.") # ✅ Añadido

    class Meta:
        unique_together = ('producto', 'nombre', 'valor')
        verbose_name = "Variación"
        verbose_name_plural = "Variaciones"
        # Puedes añadir ordering aquí si quieres un orden por defecto para las variaciones

    def __str__(self):
        parts = [self.producto.nombre]
        if self.nombre: parts.append(self.nombre)
        if self.color: parts.append(self.color)
        if self.tono: parts.append(self.tono)
        if self.presentacion: parts.append(self.presentacion)
        return " - ".join(parts)

    @property
    def precio_final(self):
        # Calcula el precio final de la variación, aplicando el descuento del producto principal
        base_price = self.price_override if self.price_override is not None else self.product.precio
        return base_price * (1 - self.product.descuento)


class MenuItem(models.Model):
    nombre = models.CharField(max_length=100)
    url = models.CharField(max_length=255, help_text="URL a la que apunta el elemento de menú")
    order = models.IntegerField(default=0, help_text="Orden de aparición en el menú")

    class Meta:
        verbose_name = "Elemento de Menú"
        verbose_name_plural = "Elementos de Menú"
        ordering = ['order']

    def __str__(self):
        return self.nombre

class SiteSetting(models.Model):
    key = models.CharField(max_length=100, unique=True, help_text="Clave de la configuración (ej. 'whatsapp_number')")
    value = models.CharField(max_length=255, help_text="Valor de la configuración")

    class Meta:
        verbose_name = "Configuración del Sitio"
        verbose_name_plural = "Configuraciones del Sitio"

    def __str__(self):
        return f"{self.key}: {self.value}"

class Anuncio(models.Model):
    titulo = models.CharField(max_length=200)
    descripcion = models.TextField(blank=True, null=True)
    imagen = CloudinaryField('imagen', blank=True, null=True)
    url = models.URLField(max_length=200, blank=True, null=True, help_text="URL a la que redirige el anuncio (opcional)")
    is_active = models.BooleanField(default=True, help_text="¿Está activo este anuncio?")
    order = models.IntegerField(default=0, help_text="Orden de visualización en el carrusel")
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    ultima_actualizacion = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Anuncio"
        verbose_name_plural = "Anuncios"
        ordering = ['order', '-fecha_creacion']

    def __str__(self):
        return self.titulo
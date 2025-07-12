from django.db import models
from django.utils.text import slugify
from decimal import Decimal
from ckeditor.fields import RichTextField
from cloudinary.models import CloudinaryField
from django.db.models import Count
from django.utils.translation import gettext_lazy as _ # Import para internacionalización de verbose_name

class Categoria(models.Model):
    # Se elimina unique=True del nombre, ya que el slug se encargará de la unicidad en la URL
    nombre = models.CharField(max_length=255)
    # Se elimina null=True, blank=True es suficiente si no se requiere el campo en la DB
    descripcion = models.TextField(blank=True)
    # Se elimina blank=True, ya que el slug se generará automáticamente y debe ser único
    slug = models.SlugField(unique=True)
    # Relación recursiva para categorías padre/hijo
    padre = models.ForeignKey(
        'self',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='subcategorias',
        help_text="Categoría padre (opcional, para subcategorías)"
    )
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    fecha_modificacion = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = _('Categoría')
        verbose_name_plural = _('Categorías')
        # Añadir índices para mejorar el rendimiento de las consultas
        indexes = [
            models.Index(fields=['slug']),
            models.Index(fields=['padre']),
        ]

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.nombre)
            # Lógica para asegurar la unicidad del slug si el nombre no es único
            original_slug = self.slug
            contador = 1
            while Categoria.objects.filter(slug=self.slug).exclude(pk=self.pk).exists():
                self.slug = f"{original_slug}-{contador}"
                contador += 1
        super().save(*args, **kwargs)

    def __str__(self):
        return self.nombre

    @property
    def productos_count(self):
        """Devuelve el número de productos asociados directamente a esta categoría."""
        # Nota: Esto ejecuta una consulta a la DB cada vez que se accede.
        # Para listas de categorías, usar el QuerySet con .annotate(Count('productos')) es más eficiente.
        return self.productos.count()

    @property
    def ruta_completa(self):
        """Devuelve la ruta completa de la categoría, ej: 'Electrónica > Smartphones'."""
        if self.padre:
            return f"{self.padre.ruta_completa} > {self.nombre}"
        return self.nombre

# Custom QuerySet para el modelo Categoria
class CategoriaQuerySet(models.QuerySet):
    def con_productos(self):
        """Anota el QuerySet con el conteo de productos para cada categoría."""
        return self.annotate(productos_count=Count('productos'))

    def principales(self):
        """Devuelve solo las categorías de nivel superior (sin padre)."""
        return self.filter(padre__isnull=True)

    def subcategorias(self, categoria):
        """Devuelve las subcategorías de una categoría específica."""
        return self.filter(padre=categoria)

# Custom Manager para el modelo Categoria
class CategoriaManager(models.Manager):
    def get_queryset(self):
        return CategoriaQuerySet(self.model, using=self._db)

    def principales_con_productos(self):
        """Devuelve las categorías principales con su conteo de productos anotado."""
        return self.get_queryset().principales().con_productos()

# Asignar el manager personalizado al modelo Categoria
objects = CategoriaManager()

class Producto(models.Model):
    nombre = models.CharField(max_length=255) # Aumentado a 255
    slug = models.SlugField(unique=True, blank=True)
    descripcion = models.TextField(blank=True, null=True)
    long_description = RichTextField(blank=True, null=True, verbose_name="Descripción Larga (con formato)")
    precio = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0.00'))
    descuento = models.DecimalField(max_digits=5, decimal_places=2, default=Decimal('0.00'), help_text="Porcentaje de descuento (ej. 0.10 para 10%)")
    imagen = CloudinaryField('imagen', blank=True, null=True)
    # Ahora Producto se relaciona directamente con Categoria (jerárquica)
    # on_delete=models.CASCADE: Si la categoría se elimina, los productos asociados también se eliminan.
    categoria = models.ForeignKey(
        Categoria,
        on_delete=models.CASCADE,
        related_name='productos',
        help_text="Categoría principal del producto"
    )
    # Eliminado el campo subcategoria ya que la jerarquía se maneja en el modelo Categoria
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
            # Lógica para asegurar la unicidad del slug si el nombre no es único
            original_slug = self.slug
            contador = 1
            while Producto.objects.filter(slug=self.slug).exclude(pk=self.pk).exists():
                self.slug = f"{original_slug}-{contador}"
                contador += 1
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
    color_hex = models.CharField(max_length=7, blank=True, null=True, help_text="Código HEX del color (ej. #FF0000)")
    tono = models.CharField(max_length=50, blank=True, null=True)
    presentacion = models.CharField(max_length=50, blank=True, null=True)
    imagen = CloudinaryField('imagen_variacion', blank=True, null=True, help_text="Imagen específica para esta variación")
    price_override = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True, help_text="Opcional: Precio para esta variación. Si está vacío, usa el precio del producto principal.")

    class Meta:
        unique_together = ('producto', 'nombre', 'valor')
        verbose_name = "Variación"
        verbose_name_plural = 'Variaciones'  

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
        base_price = self.price_override if self.price_override is not None else self.producto.precio
        return base_price * (1 - self.producto.descuento)


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
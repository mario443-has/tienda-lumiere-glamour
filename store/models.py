from decimal import Decimal, InvalidOperation, ROUND_HALF_UP
from urllib.parse import urljoin

from ckeditor.fields import RichTextField
from cloudinary.models import CloudinaryField
from django.conf import settings
from django.db import models
from django.db.models import Count
from django.templatetags.static import static
from django.utils.text import slugify
from django.utils.translation import gettext_lazy as _


# Custom QuerySet para el modelo Categoria
class CategoriaQuerySet(models.QuerySet):
    def con_productos(self):
        """Anota el QuerySet con el conteo de productos para cada categoría."""
        # Cambiado 'productos_count' a 'num_productos' para evitar conflicto con la propiedad
        return self.annotate(num_productos=Count("productos"))

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


class Categoria(models.Model):
    nombre = models.CharField(max_length=255)  # Aumentado a 255
    descripcion = models.TextField(blank=True)
    slug = models.SlugField(unique=True)  # Este campo es importante
    padre = models.ForeignKey(
        "self",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="subcategorias",
        help_text="Categoría padre (opcional, para subcategorías)",
    )
    imagen_circular = CloudinaryField(
        "imagen_circular",
        blank=True,
        null=True,
        help_text="Imagen circular para la categoría (ej. para la página de inicio)",
    )  # NUEVO CAMPO
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    fecha_modificacion = models.DateTimeField(auto_now=True)

    # ESTE manager es necesario
    objects = CategoriaManager()

    class Meta:
        verbose_name = "Categoría"
        verbose_name_plural = "Categorías"
        indexes = [
            models.Index(fields=["slug"]),
            models.Index(fields=["padre"]),
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
    def ruta_completa(self):
        """Devuelve la ruta completa de la categoría, ej: 'Electrónica > Smartphones'."""
        if self.padre:
            return f"{self.padre.ruta_completa} > {self.nombre}"
        return self.nombre


class Favorito(models.Model):
    """
    Modelo para guardar los productos favoritos de un usuario
    """

    session_key = models.CharField(max_length=40)  # Para usuarios no autenticados
    producto = models.ForeignKey(
        "Producto", on_delete=models.CASCADE, related_name="favoritos"
    )
    fecha_creacion = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("session_key", "producto")
        verbose_name = "Favorito"
        verbose_name_plural = "Favoritos"

    def __str__(self):
        return f"Favorito: {self.producto.nombre} - Session: {self.session_key}"

def _force_https(url: str) -> str:
    if not url:
        return url
    if url.startswith("//"):
        return "https:" + url
    if url.startswith("http://"):
        return "https://" + url[len("http://"):]
    return url
class Producto(models.Model):
    # Opciones para la etiqueta del producto (renombrado de ETIQUETA_CHOICES a BADGE_CHOICES)
    BADGE_CHOICES = [
        ("", "Sin etiqueta"),
        ("nuevo", "Nuevo"),
        ("tendencia", "Tendencia"),
        ("oferta", "Oferta"),
    ]

    nombre = models.CharField(max_length=255)  # Aumentado a 255
    slug = models.SlugField(unique=True, blank=True)
    descripcion = models.TextField(blank=True, null=True)
    long_description = RichTextField(
        blank=True, null=True, verbose_name="Descripción Larga (con formato)"
    )
    precio = models.DecimalField(
        max_digits=10,
        decimal_places=0,
        default=Decimal("0"),
        help_text="Ingrese el precio sin puntos ni comas (ej. 30000 para $30.000)",
    )
    descuento = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=Decimal("0.00"),
        help_text="Porcentaje de descuento (ej. 0.10 para 10%)",
    )
    imagen = CloudinaryField("imagen", blank=True, null=True)
    # Ahora Producto se relaciona directamente con Categoria (jerárquica)
    categoria = models.ForeignKey(
        Categoria,
        on_delete=models.CASCADE,
        related_name="productos",
        help_text="Categoría principal del producto",
    )
    is_active = models.BooleanField(default=True)
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    ultima_actualizacion = models.DateTimeField(auto_now=True)
    stock = models.IntegerField(default=0)
    # Campo 'badge' reemplaza 'etiqueta'
    badge = models.CharField(
        max_length=10,
        choices=BADGE_CHOICES,
        default="",
        blank=True,
        verbose_name="Etiqueta/Insignia",  # verbose_name actualizado
        help_text="Selecciona una etiqueta o insignia para mostrar en el producto (solo se mostrará una)",
    )

    class Meta:
        verbose_name = "Producto"
        verbose_name_plural = "Productos"
        ordering = ["-fecha_creacion"]

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.nombre)
            original_slug = self.slug
            contador = 1
            while Producto.objects.filter(slug=self.slug).exclude(pk=self.pk).exists():
                self.slug = f"{original_slug}-{contador}"
                contador += 1
        super().save(*args, **kwargs)

    def get_precio_final(self):
        precio_decimal = Decimal(self.precio)
        descuento_decimal = Decimal(self.descuento)
        if descuento_decimal > 0:
            final_price = precio_decimal * (1 - descuento_decimal)
            # Redondea a 0 decimales usando ROUND_HALF_UP (redondeo tradicional)
            return final_price.quantize(Decimal("1"), rounding=ROUND_HALF_UP)
        return precio_decimal

    def __str__(self):
        return self.nombre
    
    def get_precio_schema(self) -> str:
        """
        Devuelve el precio para schema.org con punto decimal y 2 decimales (e.g. '12000.00').
        """
        try:
            # get_precio_final es MÉTODO, hay que llamarlo
            valor = self.get_precio_final()
            value = Decimal(valor)
            return f"{value:.2f}"
        except (InvalidOperation, TypeError):
            return ""

    
    def get_primary_image_url(self, absolute: bool = False) -> str:
        """
        Devuelve la URL de la imagen principal del producto:
        1) campo imagen
        2) primera de la galería
        3) fallback estático
        Siempre en HTTPS. Si absolute=True y la URL es relativa, usa CANONICAL_HOST.
        """
        url = None

        # 1) Imagen principal
        if getattr(self, "imagen", None):
            try:
                url = self.imagen.url
            except Exception:
                url = None

        # 2) Primera imagen de la galería
        if not url and hasattr(self, "images") and self.images.exists():
            first = self.images.first()
            try:
                url = first.image.url  # ajusta si tu campo se llama distinto
            except Exception:
                url = None

        # 3) Fallback estático
        if not url:
            url = static("img/sin_imagen.jpg")

        # Forzar HTTPS
        url = _force_https(url)

        # Volver absoluta si se pide y la URL es relativa (empieza por "/")
        if absolute and url.startswith("/"):
            canonical = getattr(settings, "CANONICAL_HOST", "").strip()
            if canonical:
                # CANONICAL_HOST esperado sin esquema, p.ej. "lumiereglamour.com"
                base = f"https://{canonical}"
                url = urljoin(base, url)

        return url

    def get_badge_class(self):
        """
        Devuelve la clase CSS correspondiente al badge.
        """
        if self.badge == "oferta":
            return "badge-oferta"
        elif self.badge == "nuevo":
            return "badge-nuevo"
        elif self.badge == "tendencia":
            return "badge-tendencia"
        return ""


class ProductImage(models.Model):
    producto = models.ForeignKey(
        Producto, related_name="images", on_delete=models.CASCADE
    )
    image = CloudinaryField("imagen", blank=True, null=True)
    alt_text = models.CharField(
        max_length=255, blank=True, help_text="Texto alternativo para la imagen"
    )
    order = models.IntegerField(
        default=0, help_text="Orden de visualización de la imagen"
    )

    class Meta:
        verbose_name = "Imagen de Producto"
        verbose_name_plural = "Imágenes de Productos"
        ordering = ["order"]

    def __str__(self):
        return f"Imagen para {self.producto.nombre} (Orden: {self.order})"


class Variacion(models.Model):
    producto = models.ForeignKey(
        Producto, on_delete=models.CASCADE, related_name="variaciones"
    )
    nombre = models.CharField(max_length=100)
    valor = models.CharField(max_length=100)
    color = models.CharField(max_length=50, blank=True, null=True)
    color_hex = models.CharField(
        max_length=7,
        blank=True,
        null=True,
        help_text="Código HEX del color (ej. #FF0000)",
    )
    tono = models.CharField(max_length=50, blank=True, null=True)
    presentacion = models.CharField(max_length=50, blank=True, null=True)
    imagen = CloudinaryField(
        "imagen_variacion",
        blank=True,
        null=True,
        help_text="Imagen específica para esta variación",
    )
    price_override = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        blank=True,
        null=True,
        help_text="Opcional: Precio para esta variación. Si está vacío, usa el precio del producto principal.",
    )

    class Meta:
        unique_together = ("producto", "nombre", "valor")
        verbose_name = "Variación"
        verbose_name_plural = "Variaciones"

    def __str__(self):
        parts = [self.producto.nombre]
        if self.nombre:
            parts.append(self.nombre)
        if self.color:
            parts.append(self.color)
        if self.tono:
            parts.append(self.tono)
        if self.presentacion:
            parts.append(self.presentacion)
        return " - ".join(parts)

    @property
    def precio_final(self):
        base_price = (
            self.price_override
            if self.price_override is not None
            else self.producto.precio
        )
        base_price_decimal = Decimal(base_price)  # Asegurarse de que sea Decimal
        if self.producto.descuento and self.producto.descuento > 0:
            final_price = base_price_decimal * (1 - Decimal(self.producto.descuento))
            # Redondea a 0 decimales usando ROUND_HALF_UP (redondeo tradicional)
            return final_price.quantize(Decimal("1"), rounding=ROUND_HALF_UP)
        return base_price_decimal


class MenuItem(models.Model):
    nombre = models.CharField(max_length=100)
    url = models.CharField(
        max_length=255, help_text="URL a la que apunta el elemento de menú"
    )
    order = models.IntegerField(default=0, help_text="Orden de aparición en el menú")

    class Meta:
        verbose_name = "Elemento de Menú"
        verbose_name_plural = "Elementos de Menú"
        ordering = ["order"]

    def __str__(self):
        return self.nombre


class SiteSetting(models.Model):
    key = models.CharField(
        max_length=100,
        unique=True,
        help_text="Clave de la configuración (ej. 'whatsapp_number')",
    )
    value = models.CharField(max_length=255, help_text="Valor de la configuración")

    class Meta:
        verbose_name = "Configuración del Sitio"
        verbose_name_plural = "Configuraciones del Sitio"

    def __str__(self):
        return f"{self.key}: {self.value}"


class Anuncio(models.Model):
    titulo = models.CharField(max_length=200)
    descripcion = models.TextField(blank=True, null=True)
    imagen = CloudinaryField("imagen", blank=True, null=True)
    url = models.URLField(
        max_length=200,
        blank=True,
        null=True,
        help_text="URL a la que redirige el anuncio (opcional)",
    )
    is_active = models.BooleanField(
        default=True, help_text="¿Está activo este anuncio?"
    )
    order = models.IntegerField(
        default=0, help_text="Orden de visualización en el carrusel"
    )
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    ultima_actualizacion = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Anuncio"
        verbose_name_plural = "Anuncios"
        ordering = ["order", "-fecha_creacion"]

    def __str__(self):
        return self.titulo

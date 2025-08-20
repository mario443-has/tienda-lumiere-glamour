from django.contrib.sitemaps import Sitemap
from django.urls import reverse
from .models import Categoria, Producto

class CategoriaSitemap(Sitemap):
    changefreq = "weekly"
    priority = 0.7
    def items(self): return Categoria.objects.all()
    def location(self, obj): return obj.get_absolute_url()
    def lastmod(self, obj): return getattr(obj, "updated_at", None)

class ProductoSitemap(Sitemap):
    changefreq = "weekly"
    priority = 0.6
    def items(self): return Producto.objects.filter(activo=True)
    def location(self, obj): return obj.get_absolute_url()
    def lastmod(self, obj): return getattr(obj, "updated_at", None)
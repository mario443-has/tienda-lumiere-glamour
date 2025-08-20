from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path
from django.contrib.sitemaps.views import sitemap
from store.sitemaps import CategoriaSitemap, ProductoSitemap
from django.views.generic import TemplateView

sitemaps = {
    "categorias": CategoriaSitemap,
    "productos": ProductoSitemap,
}

urlpatterns = [
    path("admin/", admin.site.urls),
    path("", include("store.urls")),  # 👈 Esto conecta tu app principal
    path("ckeditor/", include("ckeditor_uploader.urls")),  # URL para CKEditor
    path("sitemap.xml", sitemap, {"sitemaps": sitemaps}, name="sitemap"),
    path(
        "robots.txt",
        TemplateView.as_view(template_name="robots.txt", content_type="text/plain"),
        name="robots_txt",
    ),
]

# Para servir archivos multimedia (como imágenes) en modo desarrollo
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

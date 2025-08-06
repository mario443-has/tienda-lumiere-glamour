from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path
from django.views.static import serve

urlpatterns = [
    path("admin/", admin.site.urls),
    path("", include("store.urls")),  # 👈 Esto conecta tu app principal
    path("ckeditor/", include("ckeditor_uploader.urls")),  # URL para CKEditor
]

# Para servir archivos multimedia (como imágenes) en modo desarrollo
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

if (
    not settings.DEBUG
    and settings.DEFAULT_FILE_STORAGE
    == "django.core.files.storage.FileSystemStorage"
):
    urlpatterns += [
        path(
            f"{settings.MEDIA_URL.lstrip('/')}" + "<path:path>",
            serve,
            {"document_root": settings.MEDIA_ROOT},
        )
    ]

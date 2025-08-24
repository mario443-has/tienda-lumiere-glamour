# store/urls.py
from django.urls import path

from . import views  # Importa tus vistas

urlpatterns = [
    path("", views.inicio, name="home"),
    path(
        "producto/<int:pk>/", views.producto_detalle, name="producto_detalle"
    ),  # CAMBIO: 'producto_id' cambiado a 'product_id'
    path(
        "google1e60e56990e838db.html",
        views.google_verification,
        name="google_verification",
    ),
    path(
        "agregar-al-carrito/", views.agregar_al_carrito, name="agregar_al_carrito"
    ),  # Nueva URL para añadir al carrito
    path(
        "api/buscar-productos/", views.api_buscar_productos, name="api_buscar_productos"
    ),  # Endpoint para búsqueda en vivo

  # Añade esta línea
    path("carrito/", views.ver_carrito, name="ver_carrito"),
    path("favoritos/", views.ver_favoritos, name="ver_favoritos"),
    path("toggle-favorito/", views.toggle_favorito, name="toggle_favorito"),
    path(
        "etiqueta/<str:badge>/",
        views.productos_por_etiqueta,
        name="productos_por_etiqueta",
    ),
    path('api/favoritos/', views.api_favoritos, name='api_favoritos'),
    
    path('categoria/<slug:slug>/', views.productos_por_categoria, name='categoria'),
]

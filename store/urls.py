# store/urls.py
from django.urls import path
from . import views  # Importa tus vistas
from .views import CategoriaListView # Agrega esta importación

urlpatterns = [
    path('', views.inicio, name='home'),
    path('producto/<int:product_id>/', views.producto_detalle, name='producto_detalle'), # CAMBIO: 'producto_id' cambiado a 'product_id'
    path("google1e60e56990e838db.html", views.google_verification, name="google_verification"),
    path('agregar-al-carrito/', views.agregar_al_carrito, name='agregar_al_carrito'), # Nueva URL para añadir al carrito
    path('categoria/<slug:slug>/', CategoriaListView.as_view(), name='categoria'), # Añade esta línea
    path('carrito/', views.ver_carrito, name='ver_carrito'),
]

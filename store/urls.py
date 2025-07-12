# store/urls.py
from django.urls import path
from . import views  # Importa tus vistas
from .views import CategoriaListView # Agrega esta importación

urlpatterns = [
    path('', views.inicio, name='home'),
    path('producto/<int:producto_id>/', views.producto_detalle, name='producto_detalle'),
    path("google1e60e56990e838db.html", views.google_verification, name="google_verification"),
    path('categoria/<slug:slug>/', CategoriaListView.as_view(), name='categoria'), # Añade esta línea
]

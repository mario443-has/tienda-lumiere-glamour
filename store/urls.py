from django.urls import path
from . import views

urlpatterns = [
    path('', views.inicio, name='index'),  # esta es tu página de inicio
    path('producto/<int:producto_id>/', views.producto_detalle, name='producto_detalle'),
]

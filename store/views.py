from django.shortcuts import render, get_object_or_404
from .models import Producto, Categoria

def inicio(request):
    productos = Producto.objects.all()
    categorias = Categoria.objects.all()
    return render(request, 'store/index.html', {'productos': productos, 'categorias': categorias})

def producto_detalle(request, producto_id):
    producto = get_object_or_404(Producto, id=producto_id)
    return render(request, 'store/producto.html', {'producto': producto})
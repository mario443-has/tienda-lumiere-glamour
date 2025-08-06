from decimal import Decimal

from django.test import TestCase

from .models import Categoria, Producto, Variacion


class PrecioFinalTests(TestCase):
    """Pruebas para el cálculo del precio final con descuentos."""

    def setUp(self):
        self.categoria = Categoria.objects.create(nombre="Cat", slug="cat")
        self.producto = Producto.objects.create(
            nombre="Prod",
            categoria=self.categoria,
            precio=Decimal("10000"),
            descuento=Decimal("0.10"),
        )

    def test_get_precio_final_applies_discount(self):
        """El método get_precio_final aplica correctamente el descuento del producto."""
        self.assertEqual(self.producto.get_precio_final(), Decimal("9000"))

    def test_variacion_precio_final_uses_product_discount(self):
        """Una variación aplica el descuento del producto al calcular su precio final."""
        variacion = Variacion.objects.create(
            producto=self.producto,
            nombre="Tipo",
            valor="Val",
            price_override=Decimal("20000.00"),
        )
        self.assertEqual(variacion.precio_final, Decimal("18000"))

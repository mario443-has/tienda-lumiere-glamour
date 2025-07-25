# Generated by Django 5.2.4 on 2025-07-14 22:20

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('store', '0012_alter_producto_precio'),
    ]

    operations = [
        migrations.AddField(
            model_name='producto',
            name='etiqueta',
            field=models.CharField(blank=True, choices=[('', 'Sin etiqueta'), ('nuevo', 'Nuevo'), ('tendencia', 'Tendencia'), ('oferta', 'Oferta')], default='', help_text='Selecciona una etiqueta para mostrar en el producto (solo se mostrará una)', max_length=10, verbose_name='Etiqueta'),
        ),
    ]

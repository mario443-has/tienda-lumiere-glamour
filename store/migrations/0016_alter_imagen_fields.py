from django.db import migrations, models
import store.models


class Migration(migrations.Migration):

    dependencies = [
        ("store", "0015_review"),
    ]

    operations = [
        migrations.AlterField(
            model_name="categoria",
            name="imagen_circular",
            field=models.ImageField(
                blank=True,
                null=True,
                storage=store.models.media_storage,
                help_text="Imagen circular para la categoría (ej. para la página de inicio)",
            ),
        ),
        migrations.AlterField(
            model_name="producto",
            name="imagen",
            field=models.ImageField(
                blank=True, null=True, storage=store.models.media_storage
            ),
        ),
        migrations.AlterField(
            model_name="productimage",
            name="image",
            field=models.ImageField(
                blank=True, null=True, storage=store.models.media_storage
            ),
        ),
        migrations.AlterField(
            model_name="variacion",
            name="imagen",
            field=models.ImageField(
                blank=True,
                null=True,
                storage=store.models.media_storage,
                help_text="Imagen específica para esta variación",
            ),
        ),
        migrations.AlterField(
            model_name="anuncio",
            name="imagen",
            field=models.ImageField(
                blank=True, null=True, storage=store.models.media_storage
            ),
        ),
    ]


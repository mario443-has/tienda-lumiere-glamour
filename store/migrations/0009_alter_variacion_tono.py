# Generated by Django 5.2.4 on 2025-07-12 06:39

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('store', '0008_alter_subcategoria_unique_together_and_more'),
    ]

    operations = [
        migrations.AlterField(
            model_name='variacion',
            name='tono',
            field=models.CharField(blank=True, max_length=50, null=100),
        ),
    ]

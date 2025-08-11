from django.core.management.commands.collectstatic import Command as CollectStaticCommand
import subprocess
from django.conf import settings

class Command(CollectStaticCommand):
    help = "Compila Tailwind antes de recolectar archivos estáticos"

    def handle(self, *args, **options):
        if settings.DEBUG:
            self.stdout.write(self.style.WARNING("🚀 Compilando Tailwind en modo desarrollo (--watch)..."))
            subprocess.run([
                "npx", "tailwindcss",
                "-i", "./static/css/main.css",
                "-o", "./static/css/output.css",
                "--watch"
            ], check=True)
        else:
            self.stdout.write(self.style.WARNING("🚀 Compilando Tailwind para producción (--minify)..."))
            subprocess.run([
                "npx", "tailwindcss",
                "-i", "./static/css/main.css",
                "-o", "./static/css/output.css",
                "--minify"
            ], check=True)

        self.stdout.write(self.style.SUCCESS("✅ Tailwind compilado correctamente."))
        super().handle(*args, **options)

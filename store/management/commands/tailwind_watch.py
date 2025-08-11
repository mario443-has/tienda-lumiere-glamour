import subprocess
import sys
import threading
from django.core.management.base import BaseCommand

class Command(BaseCommand):
    help = "Ejecuta Django y Tailwind CSS en modo watch al mismo tiempo."

    def handle(self, *args, **options):
        processes = []

        def run_tailwind():
            self.stdout.write(self.style.NOTICE("🚀 Iniciando TailwindCSS en modo watch..."))
            p = subprocess.Popen(
                ["npx", "tailwindcss", "-i", "./static/css/main.css", "-o", "./static/css/output.css", "--watch"],
                shell=True
            )
            processes.append(p)
            p.wait()

        # Lanzar Tailwind en un hilo
        tailwind_thread = threading.Thread(target=run_tailwind, daemon=True)
        tailwind_thread.start()

        # Iniciar Django
        self.stdout.write(self.style.SUCCESS("🟢 Iniciando servidor Django..."))
        p_django = subprocess.Popen([sys.executable, "manage.py", "runserver"])
        processes.append(p_django)

        try:
            p_django.wait()
        except KeyboardInterrupt:
            self.stdout.write("\n🛑 Deteniendo procesos...")
            for p in processes:
                p.terminate()

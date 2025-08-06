from django.apps import apps
from django.core.management.base import BaseCommand
from cloudinary.models import CloudinaryField


class Command(BaseCommand):
    help = "Replace http:// with https:// in CloudinaryField URLs across all models"

    def handle(self, *args, **options):
        total_fields = 0
        total_objects = 0

        for model in apps.get_models():
            cloudinary_fields = [
                field.name for field in model._meta.get_fields()
                if isinstance(field, CloudinaryField)
            ]
            if not cloudinary_fields:
                continue

            queryset = model.objects.all()
            for obj in queryset:
                updated_fields = []
                for field_name in cloudinary_fields:
                    value = getattr(obj, field_name)
                    if not value:
                        continue
                    value_str = str(value)
                    if "http://" in value_str:
                        setattr(obj, field_name, value_str.replace("http://", "https://"))
                        updated_fields.append(field_name)

                if updated_fields:
                    obj.save(update_fields=updated_fields)
                    total_objects += 1
                    total_fields += len(updated_fields)

        self.stdout.write(
            self.style.SUCCESS(
                f"Updated {total_fields} fields across {total_objects} objects"
            )
        )

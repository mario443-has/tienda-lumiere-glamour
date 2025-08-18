import os
from pathlib import Path

import dj_database_url  # Importa dj_database_url para la configuración de la base de datos
from dotenv import load_dotenv

load_dotenv()

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent

# Quick-start development settings - unsuitable for production
# See https://docs.djangoproject.com/en/5.0/howto/deployment/checklist/

# SECURITY WARNING: keep the secret key used in production secret!
# Usa una variable de entorno para la SECRET_KEY en producción
SECRET_KEY = os.environ.get(
    "SECRET_KEY", "django-insecure-your-secret-key-for-development-only"
)

# SECURITY WARNING: don't run with debug turned on in production!
# DEBUG debe ser False en producción
DEBUG = os.environ.get("DEBUG", "False").lower() == "true"

# ALLOWED_HOSTS para Render y desarrollo local
RENDER_HOSTNAME = os.environ.get("RENDER_EXTERNAL_HOSTNAME")
ALLOWED_HOSTS = ["lumiere-glamour-web.onrender.com", "localhost", "127.0.0.1"]


# Application definition

INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "django.contrib.humanize",  # NUEVO: Añadido para filtros como 'intcomma'
    "store",  # Tu aplicación de tienda
    "ckeditor",  # CKEditor
    "ckeditor_uploader",  # CKEditor Uploader
    "cloudinary",  # Añade Cloudinary
    "cloudinary_storage",  # Añade django-cloudinary-storage
]

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware",  # WhiteNoise debe ir justo después de SecurityMiddleware
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
    "store.middleware.CategoriaCacheMiddleware",
]

ROOT_URLCONF = "lumiere_glamour.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [
            BASE_DIR
            / "templates",  # Para plantillas a nivel de proyecto (ej. si tuvieras un base.html aquí)
            BASE_DIR
            / "store"
            / "templates",  # ¡NUEVO! Añade explícitamente la carpeta de plantillas de tu app 'store'
        ],
        "APP_DIRS": True,  # Esto le dice a Django que busque en la carpeta 'templates' de cada app instalada
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "lumiere_glamour.wsgi.application"
ASGI_APPLICATION = "lumiere_glamour.asgi.application"  # Mantener si usas ASGI


import dj_database_url

DATABASES = {
    "default": dj_database_url.config(
        conn_max_age=600,
        ssl_require=False  # 👈 solo en local
    )
}


# Password validation
# https://docs.djangoproject.com/en/5.0/ref/settings/#auth-password-validators

AUTH_PASSWORD_VALIDATORS = [
    {
        "NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.MinimumLengthValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.CommonPasswordValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.NumericPasswordValidator",
    },
]


# Internationalization
# https://docs.djangoproject.com/en/5.0/topics/i18n/

LANGUAGE_CODE = "es-co"  # Idioma español de Colombia

TIME_ZONE = "America/Bogota"  # Zona horaria de Bogotá, Colombia

USE_I18N = True

USE_TZ = True


# Static files (CSS, JavaScript, Images)
# https://docs.djangoproject.com/en/5.0/howto/static-files/

STATIC_URL = "/static/"
STATICFILES_DIRS = [
    os.path.join(BASE_DIR, "static"),  # Tus directorios estáticos de la app
]
STATIC_ROOT = os.path.join(
    BASE_DIR, "staticfiles"
)  # Donde collectstatic reunirá los archivos

# Configuración de WhiteNoise para servir archivos estáticos comprimidos
STATICFILES_STORAGE = "whitenoise.storage.CompressedManifestStaticFilesStorage"


# Default primary key field type
# https://docs.djangoproject.com/en/5.0/ref/settings/#default-auto-field

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"


# Cloudinary settings
# ¡IMPORTANTE! Usa variables de entorno para las credenciales de Cloudinary en producción.
# NUNCA hardcodees tus claves API en el código fuente en producción.
CLOUDINARY_CLOUD_NAME = os.environ.get("CLOUDINARY_CLOUD_NAME")
CLOUDINARY_API_KEY = os.environ.get("CLOUDINARY_API_KEY")
CLOUDINARY_API_SECRET = os.environ.get("CLOUDINARY_API_SECRET")

CLOUDINARY_STORAGE = {
    "CLOUD_NAME": CLOUDINARY_CLOUD_NAME,
    "API_KEY": CLOUDINARY_API_KEY,
    "API_SECRET": CLOUDINARY_API_SECRET,
    "SECURE": True,
}

# Configura Cloudinary como el sistema de almacenamiento por defecto para archivos de medios
DEFAULT_FILE_STORAGE = "cloudinary_storage.storage.MediaCloudinaryStorage"

# MEDIA_URL y MEDIA_ROOT aún son útiles para referencia o desarrollo local,
# pero Cloudinary gestionará el almacenamiento real en producción.
MEDIA_URL = "/media/"
MEDIA_ROOT = os.path.join(BASE_DIR, "media")

# CKEditor Uploader path
CKEDITOR_UPLOAD_PATH = (
    "uploads/"  # Asegúrate de que esta ruta sea relativa a tu media storage
)

# Seguridad para producción en Render
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
CSRF_COOKIE_SECURE = True
SESSION_COOKIE_SECURE = True

# Redirección tras login (opcional)
LOGIN_REDIRECT_URL = "/"

# Configuración para el número de WhatsApp (si no lo tienes en SiteSetting)
# Esto es un fallback, la idea es que venga de SiteSetting en la DB
WHATSAPP_NUMBER = os.environ.get("WHATSAPP_NUMBER", "573007221200")

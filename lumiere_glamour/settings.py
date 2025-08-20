# Updated settings.py
import os
from pathlib import Path

import dj_database_url 
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

# --- Seguridad y proxy detrás de Railway/Render ---

# Fuerza HTTPS en producción (si no estás depurando)
SECURE_SSL_REDIRECT = not DEBUG

# Django confía en el header del proxy para detectar HTTPS (Railway/Render lo envían)
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")

# Cookies seguras (ya las tenías en True, las reafirmamos aquí por claridad)
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True

# Si estás detrás de reverse proxy, respeta host/puerto reenviados
USE_X_FORWARDED_HOST = True
USE_X_FORWARDED_PORT = True

# --- Configuración del Host Canónico y dominios permitidos ---

# NUEVO: Define el host preferido para redirecciones, si existe.
CANONICAL_HOST = os.getenv("CANONICAL_HOST", "").strip()

# Obtiene los hosts de una variable de entorno y añade los hosts de producción como respaldo
DJANGO_ALLOWED_HOSTS = os.getenv("DJANGO_ALLOWED_HOSTS", "")
ALLOWED_HOSTS = [h.strip() for h in DJANGO_ALLOWED_HOSTS.split(",") if h.strip()]

# Agrega los hosts específicos de Railway y Render a la lista de permitidos
ALLOWED_HOSTS.extend([
    "lumiereglamour-production.up.railway.app",
    "lumiere-glamour-web.onrender.com",
])

# Si no se definen hosts en el entorno, usa los de desarrollo local
if not ALLOWED_HOSTS:
    ALLOWED_HOSTS = ["localhost", "127.0.0.1"]

# CSRF (Django exige esquema https://....)
DJANGO_CSRF_TRUSTED = os.getenv("CSRF_TRUSTED_ORIGINS", "")
CSRF_TRUSTED_ORIGINS = [o.strip() for o in DJANGO_CSRF_TRUSTED.split(",") if o.strip()]

# Agrega los orígenes de producción a la lista de confianza del CSRF
CSRF_TRUSTED_ORIGINS.extend([
    "https://lumiereglamour-production.up.railway.app",
    "https://lumiere-glamour-web.onrender.com",
])
# Suma los hosts locales SOLO en debug:
if DEBUG:
    ALLOWED_HOSTS += ["localhost", "127.0.0.1"]
    CSRF_TRUSTED_ORIGINS += [
        "http://localhost:8000",
        "http://127.0.0.1:8000",
    ]

# Application definition

INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "django.contrib.humanize",
    "django.contrib.sitemaps", 
    "store", 
    "ckeditor", 
    "ckeditor_uploader", 
    "cloudinary", 
    "cloudinary_storage",
]

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    # NUEVO: Coloca este middleware justo después de SecurityMiddleware, como se solicitó.
    # Esto asegura que las redirecciones al dominio canónico se manejen muy pronto en la petición.
    "core.middleware.CanonicalDomainRedirectMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware", 
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
            / "templates", 
            BASE_DIR
            / "store"
            / "templates", 
        ],
        "APP_DIRS": True,
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
ASGI_APPLICATION = "lumiere_glamour.asgi.application" 

# Aseguramos que la importación de dj_database_url esté una sola vez
DATABASE_URL = os.environ.get("DATABASE_URL")
DB_SSL_REQUIRED = os.environ.get("DB_SSL_REQUIRED", "False").lower() == "true"
SKIP_DB_CHECK = os.getenv("SKIP_DB_CHECK") == "1" 

# En build no exigimos DB (SKIP_DB_CHECK=1); en runtime/pre-deploy sí.
if not SKIP_DB_CHECK and not DATABASE_URL and not DEBUG:
    raise RuntimeError("DATABASE_URL is required in production")

DATABASES = {
    "default": dj_database_url.config(
        default=DATABASE_URL or f"sqlite:///{BASE_DIR / 'db.sqlite3'}",
        conn_max_age=600,
        ssl_require=DB_SSL_REQUIRED,
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

LANGUAGE_CODE = "es-co" 

TIME_ZONE = "America/Bogota" 

USE_I18N = True

USE_TZ = True


# Static files (CSS, JavaScript, Images)
# https://docs.djangoproject.com/en/5.0/howto/static-files/

STATIC_URL = "/static/"
STATICFILES_DIRS = [
    os.path.join(BASE_DIR, "static"), 
]
STATIC_ROOT = os.path.join(
    BASE_DIR, "staticfiles"
) 

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
    "uploads/" 
)

# Redirección tras login (opcional)
LOGIN_REDIRECT_URL = "/"

# Configuración para el número de WhatsApp (si no lo tienes en SiteSetting)
# Esto es un fallback, la idea es que venga de SiteSetting en la DB
WHATSAPP_NUMBER = os.environ.get("WHATSAPP_NUMBER", "573007221200")
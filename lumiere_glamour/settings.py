import os
from pathlib import Path

# BASE_DIR
BASE_DIR = Path(__file__).resolve().parent.parent

# SECRET_KEY para producción (usa variable de entorno en Render)
SECRET_KEY = os.environ.get("SECRET_KEY", "django-insecure-clave_secreta_demo")

# DEBUG controlado por entorno
DEBUG = os.environ.get("DEBUG", "False") == "True"

# ALLOWED_HOSTS
RENDER_HOSTNAME = os.environ.get("RENDER_EXTERNAL_HOSTNAME")
ALLOWED_HOSTS = [RENDER_HOSTNAME] if RENDER_HOSTNAME else ['127.0.0.1']

# Aplicaciones instaladas
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'store',
    'ckeditor',
    'ckeditor_uploader',
]

# Middleware
MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',  # WhiteNoise debe ir justo después de SecurityMiddleware
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'lumiere_glamour.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [os.path.join(BASE_DIR, 'templates')],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'lumiere_glamour.wsgi.application'
ASGI_APPLICATION = 'lumiere_glamour.asgi.application'

# Base de datos SQLite (Render puede usar PostgreSQL si prefieres)
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}

# Validadores de contraseñas
AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
]

# Zona horaria y lenguaje
LANGUAGE_CODE = 'es-co'
TIME_ZONE = 'America/Bogota'
USE_I18N = True
USE_TZ = True

# Archivos estáticos
STATIC_URL = '/static/'
STATICFILES_DIRS = [os.path.join(BASE_DIR, 'static')]
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')  # Necesario para Render

# Archivos multimedia
MEDIA_URL = '/media/'
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')

# Seguridad para producción en Render
SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
CSRF_COOKIE_SECURE = True
SESSION_COOKIE_SECURE = True

# Redirección tras login (opcional)
LOGIN_REDIRECT_URL = '/'

# CKEditor
CKEDITOR_UPLOAD_PATH = "uploads/"

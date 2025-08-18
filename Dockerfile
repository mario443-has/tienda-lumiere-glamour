# Etapa 1: construir CSS/JS con Tailwind
FROM node:20-alpine AS frontend
WORKDIR /app
COPY package*.json ./
RUN npm ci --no-audit --no-fund
COPY . .
RUN npm run update-browsers && npm run build

# Etapa 2: backend con Django + Gunicorn
FROM python:3.13-slim AS backend
WORKDIR /app

# Dependencias del sistema
RUN apt-get update && apt-get install -y \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Copiar requirements e instalarlos
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copiar todo el proyecto (incluyendo lo generado en frontend)
COPY . .
COPY --from=frontend /app/static/css/output.css ./static/css/output.css

# Collectstatic (ignora fallo si falta config en build)
RUN SKIP_DB_CHECK=1 python manage.py collectstatic --no-input || true

EXPOSE 8000
CMD ["gunicorn", "lumiere_glamour.wsgi:application", "--bind", "0.0.0.0:8000", "--log-file", "-"]

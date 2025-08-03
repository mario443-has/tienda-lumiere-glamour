# store/middleware.py

from django.core.cache import cache


class CategoriaCacheMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # Solo cacheamos URLs que comiencen con /categoria/
        if request.path.startswith("/categoria/"):
            cache_key = f"categoria_{request.path}"
            response = cache.get(cache_key)
            if response is None:
                response = self.get_response(request)
                cache.set(cache_key, response, 60 * 15)  # 15 minutos
            return response
        return self.get_response(request)

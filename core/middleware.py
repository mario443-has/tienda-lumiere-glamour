# core/middleware.py
from django.conf import settings
from django.http import HttpResponsePermanentRedirect

class CanonicalDomainRedirectMiddleware:
    """
    Redirige (301) a settings.CANONICAL_HOST si el host entrante es distinto.
    Preserva path y query. Solo GET/HEAD para no romper POST.
    Evita get_host() y build_absolute_uri() para no disparar DisallowedHost.
    """
    def __init__(self, get_response):
        self.get_response = get_response
        self.canonical_host = (getattr(settings, "CANONICAL_HOST", "") or "").strip().lower()

    def __call__(self, request):
        if not self.canonical_host:
            return self.get_response(request)

        # Host crudo sin validación (evita DisallowedHost)
        raw_host = (request.META.get("HTTP_HOST") or "").split(":")[0].lower()

        if raw_host and raw_host != self.canonical_host and request.method in ("GET", "HEAD"):
            # Preserva path y query sin tocar host
            new_url = "https://" + self.canonical_host + request.get_full_path()
            return HttpResponsePermanentRedirect(new_url)

        return self.get_response(request)

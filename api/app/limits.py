# Dueño: Julian · Límite de peticiones por IP: 60 por minuto. Frena abusos y errores de código.
# Importante: es un freno general. La IA tendrá además su propio límite por usuario (Día 16).
from fastapi import Request
from fastapi.responses import JSONResponse
from limits import parse
from limits.storage import MemoryStorage
from limits.strategies import FixedWindowRateLimiter
from starlette.types import ASGIApp, Receive, Scope, Send

# Render consulta /health muy seguido para saber si la API vive: no cuenta en el límite.
RUTAS_SIN_LIMITE = {"/health"}


def ip_cliente(request: Request) -> str:
    """La IP de quien llama.

    En Render la API está detrás de un proxy: la conexión llega desde el proxy y la IP real va
    en la cabecera X-Forwarded-For (la primera de la lista). Sin esto, todas las personas
    compartirían un solo contador. Sin la cabecera, se usa la IP de la conexión directa.

    Limitación conocida: esa cabecera puede inventarla quien llama, así que un atacante decidido
    podría esquivar el límite cambiándola. Para el MVP basta; contra abuso serio, ver v2.
    """
    primera = request.headers.get("x-forwarded-for", "").split(",")[0].strip()
    if primera:
        return primera
    return request.client.host if request.client else "desconocido"


class LimitePorIP:
    """Cuenta las peticiones de cada IP por minuto.

    Los contadores viven en la memoria de la API: se reinician si Render la reinicia o si se
    duerme, y solo sirven mientras haya una única copia corriendo (como ahora).
    """

    def __init__(self, limite: str = "60/minute") -> None:
        self.enabled = True
        self._limite = parse(limite)
        self._storage = MemoryStorage()
        self._estrategia = FixedWindowRateLimiter(self._storage)

    def permite(self, ip: str) -> bool:
        """Anota una petición de esa IP. Devuelve False si ya se pasó del límite."""
        return self._estrategia.hit(self._limite, ip)

    def reset(self) -> None:
        self._storage.reset()


limiter = LimitePorIP()


class LimiteMiddleware:
    """Responde 429 a quien pase de 60 peticiones por minuto, antes de llegar a las rutas.

    Es propio (no de slowapi) porque el de slowapi no encuentra las rutas que se registran con
    include_router en esta versión de FastAPI y dejaba pasar todo sin límite.
    """

    def __init__(self, app: ASGIApp) -> None:
        self.app = app

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        if scope["type"] != "http" or not limiter.enabled or scope["path"] in RUTAS_SIN_LIMITE:
            await self.app(scope, receive, send)
            return
        if limiter.permite(ip_cliente(Request(scope))):
            await self.app(scope, receive, send)
            return
        respuesta = JSONResponse(
            status_code=429,
            content={"detail": "Demasiadas peticiones. Espera un momento e inténtalo de nuevo."},
            headers={"Retry-After": "60"},
        )
        await respuesta(scope, receive, send)

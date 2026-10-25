# Dueño: Julian · Crea la API y registra las rutas.
import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from app.config import get_settings
from app.db import SessionDep
from app.limits import LimiteMiddleware
from app.routes import market, me, portfolio

logger = logging.getLogger(__name__)

app = FastAPI(title="The Trace API", version="0.1.0")

# Límite de peticiones por IP (60 por minuto). Responde 429 al pasarse.
app.add_middleware(LimiteMiddleware)

# CORS: solo la web nuestra puede llamar a la API desde un navegador.
# Se agrega DESPUÉS del límite para quedar por fuera: así hasta la respuesta 429 lleva las
# cabeceras CORS y el navegador la muestra como 429, no como un error de CORS.
ORIGENES_PERMITIDOS = sorted({get_settings().web_origin.rstrip("/"), "http://localhost:5173"})
app.add_middleware(
    CORSMiddleware,
    allow_origins=ORIGENES_PERMITIDOS,
    allow_methods=["GET", "POST", "DELETE"],
    allow_headers=["Authorization", "Content-Type"],
)

app.include_router(me.router)
app.include_router(market.router)
app.include_router(portfolio.router)


@app.get("/health")
def health(session: SessionDep) -> dict[str, str]:
    """Responde si la API está viva y si llega a la base."""
    try:
        session.connection().execute(text("SELECT 1"))
        db = "ok"
    except Exception:
        logger.exception("La base no responde")
        db = "error"
    return {"status": "ok", "db": db}

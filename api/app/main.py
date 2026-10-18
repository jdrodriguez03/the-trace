# Dueño: Julian · Crea la API y registra las rutas.
import logging

from fastapi import FastAPI
from sqlalchemy import text

from app.db import SessionDep
from app.routes import market, me, portfolio

logger = logging.getLogger(__name__)

app = FastAPI(title="The Trace API", version="0.1.0")
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

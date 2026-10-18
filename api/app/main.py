# Dueño: Julian · Crea la API y registra las rutas.
import logging
from typing import Annotated

from fastapi import Depends, FastAPI
from sqlalchemy import text
from sqlmodel import Session

from app.db import get_session

logger = logging.getLogger(__name__)

app = FastAPI(title="The Trace API", version="0.1.0")

SessionDep = Annotated[Session, Depends(get_session)]


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

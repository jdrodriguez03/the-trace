# Dueño: Juan Angel (escrito con Julian) · Cuota diaria de IA (ADR-0005): 5 usos por tipo al día.
import uuid

from fastapi import HTTPException
from sqlalchemy.exc import IntegrityError
from sqlmodel import Session, select

from app.clock import hoy
from app.config import get_settings
from app.models import AiUsage

TIPO_CUOTA = {"today": "today", "portfolio": "portfolio", "chat": "chat", "explain": "chat"}


def _fila(session: Session, user_id: uuid.UUID, tipo: str) -> AiUsage | None:
    return session.exec(select(AiUsage).where(
        AiUsage.user_id == user_id, AiUsage.day == hoy(), AiUsage.kind == tipo)).first()


def remaining(session: Session, user_id: uuid.UUID, tipo: str) -> int:
    fila = _fila(session, user_id, TIPO_CUOTA[tipo])
    return max(0, get_settings().ai_daily_limit - (fila.count if fila else 0))


def check(session: Session, user_id: uuid.UUID, tipo: str) -> None:
    """Responde 429 AI_QUOTA si ya no le quedan usos de este tipo hoy."""
    if remaining(session, user_id, tipo) <= 0:
        raise HTTPException(429, {"code": "AI_QUOTA",
                                  "message": "Ya usaste tus 5 usos de IA de hoy para esto. "
                                             "Mañana tienes 5 más."})


def consume(session: Session, user_id: uuid.UUID, tipo: str) -> int:
    """Descuenta un uso y devuelve cuántos quedan."""
    t = TIPO_CUOTA[tipo]
    fila = _fila(session, user_id, t)
    if fila is None:
        fila = AiUsage(user_id=user_id, day=hoy(), kind=t, count=0)
    fila.count += 1
    session.add(fila)
    try:
        session.commit()
    except IntegrityError:  # dos peticiones a la vez crearon la fila: se suma en la existente
        session.rollback()
        fila = _fila(session, user_id, t)
        fila.count += 1
        session.add(fila)
        session.commit()
    return remaining(session, user_id, tipo)

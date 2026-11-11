# Dueño: Julian · Lee cuántos usos de IA lleva hoy una persona. Solo lectura: lo usa /v1/me.
# Contar y frenar los usos (el 429 AI_QUOTA) vive en app/ai/quota.py, de Juan Angel.
import uuid

from sqlmodel import Session, select

from app.clock import hoy
from app.models import AiUsage

TIPOS_IA = ("today", "portfolio", "chat", "explain")


def uses_today(session: Session, user_id: uuid.UUID) -> dict[str, int]:
    """Usos de hoy por tipo. Los tipos sin uso salen en 0, para que la web no adivine."""
    filas = session.exec(
        select(AiUsage).where(AiUsage.user_id == user_id, AiUsage.day == hoy())
    ).all()
    usados = dict.fromkeys(TIPOS_IA, 0)
    for f in filas:
        usados[f.kind] = f.count
    return usados

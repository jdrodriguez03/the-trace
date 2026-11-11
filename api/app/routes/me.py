# Dueño: Julian · Quién soy: lo usa la web para el menú de cuenta y para mostrar la cuota de IA.
from fastapi import APIRouter

from app.auth import CurrentUser
from app.config import get_settings
from app.core.quota import uses_today
from app.db import SessionDep
from app.schemas import AiQuotaOut, MeOut

router = APIRouter(prefix="/v1", tags=["me"])


@router.get("/me", response_model=MeOut)
def me(user: CurrentUser, session: SessionDep) -> MeOut:
    """Datos de la persona que inició sesión y sus usos de IA de hoy. Sin token responde 401."""
    cuota = AiQuotaOut(used=uses_today(session, user.id), limit=get_settings().ai_daily_limit)
    return MeOut(id=user.id, email=user.email, is_guest=user.is_guest, ai_quota=cuota)

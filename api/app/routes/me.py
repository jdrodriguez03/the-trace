# Dueño: Julian · Quién soy: lo usa la web para el menú de cuenta.
from fastapi import APIRouter

from app.auth import CurrentUser
from app.schemas import MeOut

router = APIRouter(prefix="/v1", tags=["me"])


@router.get("/me", response_model=MeOut)
def me(user: CurrentUser) -> MeOut:
    """Datos de la persona que inició sesión. Sin token responde 401."""
    return MeOut(id=user.id, email=user.email, is_guest=user.is_guest)

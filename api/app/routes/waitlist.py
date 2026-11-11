# Dueño: Julian · «Avísame cuando esté listo»: anota a la persona en la lista de espera de Trace+.
from fastapi import APIRouter
from sqlalchemy.exc import IntegrityError
from sqlmodel import select

from app.auth import CurrentUser
from app.db import SessionDep
from app.models import WaitlistEntry
from app.schemas import WaitlistOut

router = APIRouter(prefix="/v1/waitlist", tags=["waitlist"])

PLAN = "trace_plus"


@router.post("/trace-plus", response_model=WaitlistOut)
def join_trace_plus(user: CurrentUser, session: SessionDep) -> WaitlistOut:
    """Anota a la persona una sola vez. Si ya estaba, no duplica y responde already=True."""
    existe = session.exec(
        select(WaitlistEntry).where(WaitlistEntry.user_id == user.id, WaitlistEntry.plan == PLAN)
    ).first()
    if existe:
        return WaitlistOut(plan=PLAN, already=True)
    session.add(WaitlistEntry(user_id=user.id, plan=PLAN))
    try:
        session.commit()
    except IntegrityError:  # dos clics al mismo tiempo: la base frena el duplicado
        session.rollback()
        return WaitlistOut(plan=PLAN, already=True)
    return WaitlistOut(plan=PLAN, already=False)

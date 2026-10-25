# Dueño: Julian · El mercado: las 10 acciones y el COLCAP. Es público, no pide sesión.
from fastapi import APIRouter, HTTPException
from sqlmodel import select

from app.core.prices import latest_prices
from app.db import SessionDep
from app.models import IndexSnapshot
from app.schemas import AssetOut, ColcapOut

# PROVISIONAL: cambiar por api/app/content/drivers.py de Isabela.
from scripts.provisional_content import DRIVER_DEFAULT, DRIVERS

router = APIRouter(prefix="/v1/market", tags=["market"])


@router.get("/assets", response_model=list[AssetOut])
def acciones(session: SessionDep) -> list[AssetOut]:
    """Las acciones con su precio más reciente, su cambio del día y la hora de actualización."""
    filas = latest_prices(session)
    return [
        AssetOut(
            ticker=a.ticker, name=a.name, sector=a.sector, price=p.price,
            change_pct=p.change_pct, updated_at=p.updated_at,
            drivers=DRIVERS.get(a.ticker, DRIVER_DEFAULT),
        )
        for a, p in filas
    ]


@router.get("/colcap", response_model=ColcapOut)
def colcap(session: SessionDep) -> ColcapOut:
    """El COLCAP más reciente: puntos y cambio del día."""
    fila = session.exec(
        select(IndexSnapshot)
        .where(IndexSnapshot.code == "COLCAP")
        .order_by(IndexSnapshot.day.desc())
        .limit(1)
    ).first()
    if fila is None:
        raise HTTPException(status_code=404, detail="Todavía no hay datos del COLCAP.")
    return ColcapOut(points=fila.points, change_pct=fila.change_pct, day=fila.day,
                     updated_at=fila.updated_at)

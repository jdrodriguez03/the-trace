# Dueño: Julian · El mercado: las 10 acciones y el COLCAP. Es público, no pide sesión.
from fastapi import APIRouter, HTTPException
from sqlalchemy import and_, func
from sqlmodel import select

from app.db import SessionDep
from app.models import Asset, IndexSnapshot, PriceSnapshot
from app.schemas import AssetOut, ColcapOut

router = APIRouter(prefix="/v1/market", tags=["market"])


@router.get("/assets", response_model=list[AssetOut])
def acciones(session: SessionDep) -> list[AssetOut]:
    """Las acciones con su precio más reciente, su cambio del día y la hora de actualización."""
    # Para cada acción, el día más reciente que tenga precio guardado.
    ultimo_dia = (
        select(PriceSnapshot.ticker, func.max(PriceSnapshot.day).label("dia"))
        .group_by(PriceSnapshot.ticker)
        .subquery()
    )
    filas = session.exec(
        select(Asset, PriceSnapshot)
        .join(PriceSnapshot, PriceSnapshot.ticker == Asset.ticker)
        .join(
            ultimo_dia,
            and_(ultimo_dia.c.ticker == PriceSnapshot.ticker, ultimo_dia.c.dia == PriceSnapshot.day),
        )
        .order_by(Asset.ticker)
    ).all()
    return [
        AssetOut(
            ticker=a.ticker, name=a.name, sector=a.sector, price=p.price,
            change_pct=p.change_pct, updated_at=p.updated_at,
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

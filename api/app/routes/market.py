# Dueño: Julian · El mercado: las 10 acciones y el COLCAP. Es público, no pide sesión.
from typing import Annotated

from fastapi import APIRouter, HTTPException, Query
from sqlmodel import select

from app.clock import hoy
from app.content.drivers import DRIVER_DEFAULT, DRIVERS
from app.core.history import desde_para
from app.core.loaders import load_closes
from app.core.market_refresh import colcap_es_fondo, refresh_if_stale
from app.core.prices import latest_prices
from app.db import SessionDep
from app.models import Asset, IndexSnapshot
from app.schemas import AssetOut, ColcapOut, PricePointOut, Rango

router = APIRouter(prefix="/v1/market", tags=["market"])


@router.get("/assets", response_model=list[AssetOut])
def acciones(session: SessionDep) -> list[AssetOut]:
    """Las acciones con su precio más reciente, su cambio del día y la hora de actualización."""
    refresh_if_stale(session)
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
    """El COLCAP más reciente: cambio del día y puntos (si proxy=True, es el fondo ICOLCAP)."""
    refresh_if_stale(session)
    fila = session.exec(
        select(IndexSnapshot)
        .where(IndexSnapshot.code == "COLCAP")
        .order_by(IndexSnapshot.day.desc())
        .limit(1)
    ).first()
    if fila is None:
        raise HTTPException(status_code=404, detail="Todavía no hay datos del COLCAP.")
    return ColcapOut(points=fila.points, change_pct=fila.change_pct, day=fila.day,
                     updated_at=fila.updated_at, proxy=colcap_es_fondo(fila.source))


@router.get("/assets/{ticker}/history", response_model=list[PricePointOut])
def historial(ticker: str, session: SessionDep,
              rango: Annotated[Rango, Query(alias="range")] = "1m") -> list[PricePointOut]:
    """Los precios diarios de una acción para su gráfica: último mes, 3 meses o año."""
    ticker = ticker.strip().upper()
    if session.get(Asset, ticker) is None:
        raise HTTPException(status_code=404, detail="Esa acción no existe en The Trace.")
    cierres = load_closes(session, desde_para(rango, hoy()), {ticker}).get(ticker, [])
    return [PricePointOut(day=c.day, price=c.price) for c in cierres]


@router.get("/history", response_model=dict[str, list[PricePointOut]])
def historiales(session: SessionDep,
                rango: Annotated[Rango, Query(alias="range")] = "1y") -> dict[str, list[PricePointOut]]:
    """Los precios diarios de TODAS las acciones y del COLCAP en una sola petición.

    La web los pide una vez al abrir: así no hace 11 peticiones y no choca con el límite por IP
    cuando muchas personas entran desde la misma red (por ejemplo, en la presentación).
    """
    desde = desde_para(rango, hoy())
    salida = {
        t: [PricePointOut(day=c.day, price=c.price) for c in cierres]
        for t, cierres in load_closes(session, desde).items()
    }
    indice = session.exec(
        select(IndexSnapshot)
        .where(IndexSnapshot.code == "COLCAP", IndexSnapshot.day >= desde)
        .order_by(IndexSnapshot.day)
    ).all()
    if indice:
        salida["COLCAP"] = [PricePointOut(day=f.day, price=f.points) for f in indice]
    return salida

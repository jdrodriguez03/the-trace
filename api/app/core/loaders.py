# Dueño: Julian · Lee de la base lo que necesitan los cálculos, en un solo lugar.
# Portafolio, Noticias y Hoy usan estas funciones: así las tres pantallas cuentan lo mismo.
import uuid
from datetime import datetime

from sqlmodel import Session, select

from app.core.portfolio import Movimiento, Precio, Resumen, calculate_portfolio
from app.core.prices import latest_prices
from app.models import IndexSnapshot, NewsItem, Transaction


def load_summary(session: Session, user_id: uuid.UUID) -> tuple[Resumen, datetime | None]:
    """Tu portafolio calculado con los últimos precios, y la hora del precio más reciente."""
    movimientos = [
        Movimiento(ticker=m.ticker, kind=m.kind, quantity=m.quantity, price=m.price, day=m.day,
                   id=m.id)
        for m in session.exec(select(Transaction).where(Transaction.user_id == user_id))
    ]
    filas = latest_prices(session)
    precios = {a.ticker: Precio(price=p.price, change_pct=p.change_pct) for a, p in filas}
    activos = {a.ticker: (a.name, a.sector) for a, _ in filas}
    actualizado = max((p.updated_at for _, p in filas), default=None)
    return calculate_portfolio(movimientos, precios, activos), actualizado


def load_news(session: Session) -> list[NewsItem]:
    return list(session.exec(select(NewsItem)))


def latest_colcap(session: Session) -> IndexSnapshot | None:
    return session.exec(
        select(IndexSnapshot)
        .where(IndexSnapshot.code == "COLCAP")
        .order_by(IndexSnapshot.day.desc())
        .limit(1)
    ).first()

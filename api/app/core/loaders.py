# Dueño: Julian · Lee de la base lo que necesitan los cálculos, en un solo lugar.
# Portafolio, Noticias y Hoy usan estas funciones: así las tres pantallas cuentan lo mismo.
import uuid
from datetime import date, datetime

from sqlmodel import Session, select

from app.core.portfolio import Movimiento, Precio, Resumen, calculate_portfolio
from app.core.prices import latest_prices
from app.models import IndexSnapshot, NewsItem, PriceSnapshot, Transaction
from app.providers.base import Cierre


def load_summary(session: Session, user_id: uuid.UUID) -> tuple[Resumen, datetime | None]:
    """Tu portafolio calculado con los últimos precios, y la hora del precio más reciente."""
    movimientos = load_movements(session, user_id)
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


def load_closes(session: Session, desde: date, tickers: set[str] | None = None,
                ) -> dict[str, list[Cierre]]:
    """Los precios diarios guardados desde una fecha, por acción y del más viejo al más nuevo.

    Incluye la fila de hoy (que se va actualizando): así la gráfica termina en el precio actual.
    """
    consulta = select(PriceSnapshot).where(PriceSnapshot.day >= desde)
    if tickers is not None:
        consulta = consulta.where(PriceSnapshot.ticker.in_(tickers))
    salida: dict[str, list[Cierre]] = {}
    for p in session.exec(consulta.order_by(PriceSnapshot.day)):
        salida.setdefault(p.ticker, []).append(Cierre(day=p.day, price=p.price))
    return salida


def load_movements(session: Session, user_id: uuid.UUID) -> list[Movimiento]:
    return [
        Movimiento(ticker=m.ticker, kind=m.kind, quantity=m.quantity, price=m.price, day=m.day,
                   id=m.id)
        for m in session.exec(select(Transaction).where(Transaction.user_id == user_id))
    ]

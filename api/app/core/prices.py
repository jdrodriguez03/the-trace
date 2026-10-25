# Dueño: Julian · Lee de la base el último precio de cada acción. Lo usan mercado, portafolio y Hoy.
from sqlalchemy import and_, func
from sqlmodel import Session, select

from app.models import Asset, PriceSnapshot


def latest_prices(session: Session) -> list[tuple[Asset, PriceSnapshot]]:
    """Cada acción con su fila de precio del día más reciente que tengamos, ordenadas por ticker."""
    # Subconsulta: para cada acción, la fecha más reciente con precio guardado.
    ultimo_dia = (
        select(PriceSnapshot.ticker, func.max(PriceSnapshot.day).label("dia"))
        .group_by(PriceSnapshot.ticker)
        .subquery()
    )
    return list(session.exec(
        select(Asset, PriceSnapshot)
        .join(PriceSnapshot, PriceSnapshot.ticker == Asset.ticker)
        .join(
            ultimo_dia,
            and_(ultimo_dia.c.ticker == PriceSnapshot.ticker, ultimo_dia.c.dia == PriceSnapshot.day),
        )
        .order_by(Asset.ticker)
    ).all())

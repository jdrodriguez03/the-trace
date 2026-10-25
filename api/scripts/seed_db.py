# Dueño: Julian · Carga las 10 acciones, sus precios de hoy, el COLCAP y las 11 noticias.
# Se puede correr varias veces sin duplicar nada.
# Uso (desde api/):  uv run python -m scripts.seed_db
from datetime import date
from decimal import Decimal

from sqlmodel import Session, select

from app.clock import hoy
from app.db import engine
from app.models import Asset, IndexSnapshot, NewsItem, PriceSnapshot, ahora
from scripts.provisional_catalog import ASSETS, COLCAP
from scripts.provisional_content import CAUSES, NEWS, RADAR


def seed(session: Session, day: date | None = None) -> dict[str, int]:
    """Deja las acciones, el precio del día y el COLCAP. Devuelve cuántas filas hay."""
    day = day or hoy()

    for a in ASSETS:
        asset = session.get(Asset, a["ticker"])
        if asset is None:
            asset = Asset(ticker=a["ticker"], yahoo_symbol=a["yahoo"], name=a["name"],
                          sector=a["sector"])
        else:
            asset.yahoo_symbol, asset.name, asset.sector = a["yahoo"], a["name"], a["sector"]
        session.add(asset)
    session.flush()  # las acciones deben existir antes que sus precios (llave foránea)

    for a in ASSETS:
        fila = session.exec(
            select(PriceSnapshot).where(
                PriceSnapshot.ticker == a["ticker"], PriceSnapshot.day == day
            )
        ).first()
        if fila is not None and fila.source != "catalogo":
            continue  # ya hay un precio real (Yahoo o CSV): no se pisa con el de ejemplo
        if fila is None:
            fila = PriceSnapshot(ticker=a["ticker"], day=day, price=Decimal(a["price"]),
                                 change_pct=a["change"], source="catalogo")
        else:
            fila.price, fila.change_pct, fila.updated_at = Decimal(a["price"]), a["change"], ahora()
        session.add(fila)

    colcap = session.exec(
        select(IndexSnapshot).where(IndexSnapshot.code == COLCAP["code"], IndexSnapshot.day == day)
    ).first()
    if colcap is None:
        colcap = IndexSnapshot(code=COLCAP["code"], day=day, points=Decimal(COLCAP["points"]),
                               change_pct=COLCAP["change"], source="catalogo")
        session.add(colcap)
    elif colcap.source == "catalogo":
        colcap.points, colcap.change_pct, colcap.updated_at = (
            Decimal(COLCAP["points"]), COLCAP["change"], ahora())
        session.add(colcap)

    # Noticias de ejemplo: se reconocen por acción y título, así no se duplican al repetir.
    for n in NEWS:
        existe = session.exec(
            select(NewsItem).where(NewsItem.ticker == n["ticker"], NewsItem.title == n["title"])
        ).first()
        if existe is None:
            why, watch = RADAR.get(n["id"], ("", ""))
            session.add(NewsItem(ticker=n["ticker"], direction=n["direction"],
                                 magnitude=n["magnitude"], title=n["title"], summary=n["summary"],
                                 why=why, watch=watch, cause=CAUSES.get(n["id"]), day=day))

    session.commit()
    return {
        "acciones": len(session.exec(select(Asset)).all()),
        "noticias": len(session.exec(select(NewsItem)).all()),
        "precios": len(session.exec(select(PriceSnapshot)).all()),
        "colcap": len(session.exec(select(IndexSnapshot)).all()),
    }


if __name__ == "__main__":
    with Session(engine) as session:
        resultado = seed(session)
    print(f"Listo. Filas en la base: {resultado}")

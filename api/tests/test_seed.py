from datetime import date
from decimal import Decimal

from sqlmodel import Session, SQLModel, select

from app import models  # noqa: F401  (registra las tablas)
from app.db import engine
from app.models import Asset, IndexSnapshot, PriceSnapshot
from scripts.seed_db import seed

DIA = date(2026, 10, 18)


def test_seed_carga_10_acciones_y_se_puede_repetir():
    SQLModel.metadata.create_all(engine)
    with Session(engine) as session:
        seed(session, DIA)
        resultado = seed(session, DIA)  # la segunda vez no debe duplicar nada
        assert resultado["acciones"] == 10
        assert len(session.exec(select(PriceSnapshot).where(PriceSnapshot.day == DIA)).all()) == 10
        assert len(session.exec(select(IndexSnapshot).where(IndexSnapshot.day == DIA)).all()) == 1


def test_el_portafolio_de_ejemplo_vale_8_586_000():
    SQLModel.metadata.create_all(engine)
    cantidades = {"ECOPETROL": 1200, "PFBCOLOM": 60, "ISA": 90, "GRUPOSURA": 40}
    with Session(engine) as session:
        seed(session, DIA)
        precios = {
            p.ticker: p.price
            for p in session.exec(select(PriceSnapshot).where(PriceSnapshot.day == DIA))
        }
    assert sum(precios[t] * q for t, q in cantidades.items()) == Decimal(8_586_000)


def test_el_seed_no_pisa_un_precio_real():
    otro_dia = date(2026, 10, 20)
    SQLModel.metadata.create_all(engine)
    with Session(engine) as session:
        seed(session, otro_dia)
        fila = session.exec(
            select(PriceSnapshot).where(
                PriceSnapshot.ticker == "ECOPETROL", PriceSnapshot.day == otro_dia
            )
        ).one()
        fila.price, fila.source = Decimal(2400), "yahoo"
        session.add(fila)
        session.commit()

        seed(session, otro_dia)
        session.refresh(fila)
        assert fila.price == Decimal(2400)
        assert fila.source == "yahoo"
        assert session.get(Asset, "ECOPETROL") is not None

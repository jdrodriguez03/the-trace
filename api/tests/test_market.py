from datetime import timedelta

from sqlmodel import Session

from app.clock import hoy
from app.db import engine
from app.models import PriceSnapshot


def test_las_10_acciones_salen_sin_iniciar_sesion(api):
    r = api.get("/v1/market/assets")
    assert r.status_code == 200
    acciones = {a["ticker"]: a for a in r.json()}
    assert len(acciones) == 10
    eco = acciones["ECOPETROL"]
    assert eco["price"] == 2350 and eco["change_pct"] == -1.4
    assert eco["name"] and eco["sector"] and eco["updated_at"]


def test_si_hay_dos_dias_sale_el_mas_reciente(api):
    ayer = hoy() - timedelta(days=1)
    with Session(engine) as s:
        s.add(PriceSnapshot(ticker="ECOPETROL", day=ayer, price=1, change_pct=0, source="csv"))
        s.commit()
    acciones = {a["ticker"]: a for a in api.get("/v1/market/assets").json()}
    assert len(acciones) == 10  # no se duplica la acción
    assert acciones["ECOPETROL"]["price"] == 2350  # el de hoy, no el de ayer


def test_colcap_sale_sin_iniciar_sesion(api):
    r = api.get("/v1/market/colcap")
    assert r.status_code == 200
    assert r.json()["points"] == 1812.4 and r.json()["change_pct"] == 0.6

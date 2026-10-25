# Dueño: Julian · Pruebas de los cálculos del portafolio (día 8). Siempre con precios fijos.
from datetime import date
from decimal import Decimal

import pytest

from app.core.formats import cop, pct
from app.core.portfolio import Movimiento, Precio, calculate_portfolio
from scripts.provisional_catalog import ASSETS
from tests.conftest import entrar

DIA = date(2026, 10, 19)
PRECIOS = {a["ticker"]: Precio(Decimal(a["price"]), a["change"]) for a in ASSETS}
ACTIVOS = {a["ticker"]: (a["name"], a["sector"]) for a in ASSETS}

# Portafolio de ejemplo de la guía, comprado a los precios del catálogo.
EJEMPLO = [
    Movimiento(t, "buy", Decimal(q), PRECIOS[t].price, DIA, i)
    for i, (t, q) in enumerate(
        [("ECOPETROL", 1200), ("PFBCOLOM", 60), ("ISA", 90), ("GRUPOSURA", 40)], start=1
    )
]


def compra(q, p, dia=DIA, i=None, t="ECOPETROL"):
    return Movimiento(t, "buy", Decimal(q), Decimal(p), dia, i)


def venta(q, p, dia=DIA, i=None, t="ECOPETROL"):
    return Movimiento(t, "sell", Decimal(q), Decimal(p), dia, i)


def precio(p, cambio=0.0, t="ECOPETROL"):
    return {t: Precio(Decimal(p), cambio)}


# ---- Portafolio de ejemplo ----
def test_portafolio_de_ejemplo_da_las_cifras_de_la_guia():
    r = calculate_portfolio(EJEMPLO, PRECIOS, ACTIVOS)
    assert r.total_value == 8_586_000
    assert round(r.day_change) == 5_774
    assert round(r.day_change_pct, 2) == 0.07
    assert r.gain == 0  # se compró al precio de hoy: ni gana ni pierde
    ecopetrol = next(p for p in r.positions if p.ticker == "ECOPETROL")
    assert round(ecopetrol.weight_pct, 1) == 32.8
    assert r.positions[0].ticker == "ECOPETROL"  # ordenadas de mayor a menor valor
    assert r.top_sector == "Petróleo y energía"
    assert len(r.sectors) == 4


# ---- Costo promedio y ganancia ----
def test_100_acciones_a_2000_que_valen_2200_ganan_20000():
    r = calculate_portfolio([compra(100, 2000)], precio(2200), ACTIVOS)
    p = r.positions[0]
    assert p.gain == 20_000 and round(p.gain_pct, 1) == 10.0
    assert r.gain == 20_000 and round(r.gain_pct, 1) == 10.0


def test_costo_promedio_ponderado_y_ganancia_realizada():
    movs = [compra(100, 2000, i=1), compra(100, 3000, i=2), venta(50, 3000, i=3)]
    r = calculate_portfolio(movs, precio(3000), ACTIVOS)
    p = r.positions[0]
    assert p.quantity == 150
    assert p.avg_cost == 2500  # vender no cambia el costo promedio
    assert p.realized_gain == 25_000  # (3.000 − 2.500) × 50
    assert r.realized_gain == 25_000


def test_vender_todo_y_volver_a_comprar_arranca_un_promedio_nuevo():
    movs = [
        compra(10, 1000, date(2026, 10, 1), 1),
        venta(10, 1500, date(2026, 10, 2), 2),
        compra(10, 4000, date(2026, 10, 3), 3),
    ]
    r = calculate_portfolio(movs, precio(4000), ACTIVOS)
    assert r.positions[0].avg_cost == 4000
    assert r.realized_gain == 5_000


def test_vender_todo_no_deja_posicion_pero_si_ganancia_realizada():
    r = calculate_portfolio([compra(10, 1000, i=1), venta(10, 900, i=2)], precio(900), ACTIVOS)
    assert r.positions == [] and r.total_value == 0
    assert r.realized_gain == -1_000


def test_portafolio_vacio_no_divide_por_cero():
    r = calculate_portfolio([], PRECIOS, ACTIVOS)
    assert r.total_value == 0 and r.gain_pct == 0 and r.top_sector is None


# ---- Formatos ----
@pytest.mark.parametrize("valor, texto", [
    (8_586_000, "$8.586.000"), (5773.73, "$5.774"), (0, "$0"), (-40_040.57, "−$40.041"),
])
def test_cop(valor, texto):
    assert cop(valor) == texto


@pytest.mark.parametrize("valor, kwargs, texto", [
    (1.4, {}, "+1,4 %"), (-0.6, {}, "−0,6 %"), (0.04, {}, "0,0 %"),
    (32.84, {"signo": False}, "32,8 %"), (0.05, {}, "+0,1 %"),
])
def test_pct(valor, kwargs, texto):
    assert pct(valor, **kwargs) == texto


# ---- La ruta ----
def test_la_ruta_devuelve_posiciones_y_resumen(api):
    h = entrar()
    for t, q in [("ECOPETROL", 1200), ("PFBCOLOM", 60), ("ISA", 90), ("GRUPOSURA", 40)]:
        assert api.post("/v1/portfolio/transactions", headers=h,
                        json={"ticker": t, "kind": "buy", "quantity": q}).status_code == 201
    r = api.get("/v1/portfolio", headers=h).json()
    s = r["summary"]
    assert s["total_value"] == 8_586_000 and round(s["day_change"]) == 5_774
    assert s["positions_count"] == 4 and s["top_sector"] == "Petróleo y energía"
    eco = r["positions"][0]
    assert eco["ticker"] == "ECOPETROL" and eco["avg_cost"] == 2350
    assert round(eco["weight_pct"], 1) == 32.8
    assert len(r["holdings"]) == 4  # el campo viejo sigue igual

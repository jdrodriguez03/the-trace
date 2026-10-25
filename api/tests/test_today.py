# Dueño: Julian · Pruebas del modelo de Hoy (día 9) y de «Empezar de nuevo» (día 11).
from datetime import date
from decimal import Decimal

from app.core.formats import parte
from app.core.portfolio import Movimiento, Precio, calculate_portfolio
from app.core.today import (
    Noticia,
    colcap_line,
    monto_aprox,
    today_cause,
    today_extended,
    today_head,
    today_lead,
    today_model,
)
from scripts.provisional_catalog import ASSETS, COLCAP
from scripts.provisional_content import CAUSES, NEWS
from tests.conftest import entrar

DIA = date(2026, 10, 20)
PRECIOS = {a["ticker"]: Precio(Decimal(a["price"]), a["change"]) for a in ASSETS}
ACTIVOS = {a["ticker"]: (a["name"], a["sector"]) for a in ASSETS}
NOTICIAS = [Noticia(n["id"], n["ticker"], n["direction"], n["magnitude"]) for n in NEWS]


def modelo(cantidades: dict[str, int], precios=PRECIOS):
    movs = [Movimiento(t, "buy", Decimal(q), precios[t].price, DIA, i)
            for i, (t, q) in enumerate(cantidades.items(), start=1)]
    return today_model(calculate_portfolio(movs, precios, ACTIVOS))


EJEMPLO = {"ECOPETROL": 1200, "PFBCOLOM": 60, "ISA": 90, "GRUPOSURA": 40}


# ---- Portafolio de ejemplo: las frases exactas de la guía ----
def test_la_que_mas_peso_es_ecopetrol():
    m = modelo(EJEMPLO)
    assert m.top.ticker == "ECOPETROL" and m.direction == "up"


def test_titular_del_ejemplo():
    assert today_head(modelo(EJEMPLO)) == "Hoy tu portafolio subió 0,1 %, unos $5.800 más"


def test_explicacion_del_ejemplo():
    assert today_lead(modelo(EJEMPLO), NOTICIAS, CAUSES) == [
        "La que más pesó fue Ecopetrol, que bajó porque el precio del petróleo bajó.",
        "Representa 33 % de tu dinero, así que su bajada movió tu portafolio unos $40.000 menos.",
        "Del otro lado, ISA subió 1,9 % y compensó una parte.",
    ]


def test_colcap_del_ejemplo():
    texto = colcap_line(COLCAP["change"], modelo(EJEMPLO))
    assert texto == "Hoy las acciones más grandes del país subieron un poco. A tu portafolio le fue peor."
    assert colcap_line(COLCAP["change"]) == "Hoy las acciones más grandes del país subieron un poco."


def test_explicacion_de_respaldo_del_ejemplo():
    e = today_extended(modelo(EJEMPLO), COLCAP["change"], NOTICIAS, CAUSES)
    assert [a["ticker"] for a in e["by_asset"]] == ["ECOPETROL", "ISA", "PFBCOLOM", "GRUPOSURA"]
    assert e["by_asset"][0]["text"] == ("33 % de tu dinero · movió tu portafolio unos $40.000 menos."
                                        " Por qué: el precio del petróleo bajó.")
    assert e["vs_colcap"] == ("El COLCAP, el termómetro de las acciones más grandes de Colombia, "
                              "subió 0,6 %. Tu portafolio subió 0,1 %. Hoy le fue peor que al COLCAP.")
    assert e["concentration"] is None  # Ecopetrol pesa 32,8 %: no pasa de 40 %
    assert e["footer"].startswith("Esto explica lo que pasó.")


# ---- Otros casos ----
def test_la_mayor_causa_cuando_va_del_mismo_lado_que_el_portafolio():
    m = modelo({"MINEROS": 100})  # sube 2,8 % y el oro subió
    assert m.direction == "up"
    assert today_lead(m, NOTICIAS, CAUSES)[0] == "La mayor causa fue Mineros, porque el precio del oro subió."


def test_sin_noticia_que_explique():
    m = modelo({"GEB": 1000})  # sube 1,2 %, pero su única noticia es neutra
    assert today_lead(m, NOTICIAS, CAUSES)[0] == (
        "La que más pesó fue Grupo Energía Bogotá, que subió 1,2 %. "
        "Hoy no hay una noticia clara que lo explique.")


def test_una_buena_noticia_no_explica_una_bajada():
    bajada = {**PRECIOS, "CELSIA": Precio(Decimal(4100), -1.0)}  # Celsia solo tiene noticia buena
    m = modelo({"CELSIA": 100}, bajada)
    assert today_cause(m.top, NOTICIAS, CAUSES) is None


def test_si_hay_varias_noticias_gana_la_de_mayor_impacto():
    m = modelo({"ECOPETROL": 100})
    assert today_cause(m.top, NOTICIAS, CAUSES) == "el precio del petróleo bajó"  # Alta, no la Baja


def test_todas_hacia_el_mismo_lado():
    frases = today_lead(modelo({"MINEROS": 100, "CELSIA": 100}), NOTICIAS, CAUSES)
    assert frases[-1] == "Todas tus acciones se movieron hacia el mismo lado."


def test_casi_sin_cambios():
    sin_cambio = {t: Precio(p.price, 0.0) for t, p in PRECIOS.items()}
    m = modelo({"ISA": 10}, sin_cambio)
    assert m.direction == "flat"
    assert today_head(m) == "Hoy tu portafolio casi no cambió"
    assert today_lead(m, NOTICIAS, CAUSES) == ["Ninguna de tus acciones se movió hoy."]


def test_concentracion_cuando_un_sector_pasa_de_40():
    e = today_extended(modelo({"ISA": 100, "CELSIA": 100}), COLCAP["change"], NOTICIAS, CAUSES)
    assert e["concentration"].startswith("100 % de tu dinero está en Energía eléctrica.")


def test_portafolio_vacio_no_tiene_modelo():
    assert today_model(calculate_portfolio([], PRECIOS, ACTIVOS)) is None


def test_montos_aproximados():
    assert monto_aprox(Decimal("5773.7")) == "unos $5.800 más"
    assert monto_aprox(Decimal("-40040.6")) == "unos $40.000 menos"
    assert monto_aprox(Decimal(344)) == "unos $340 más"  # menos de $1.000: a la decena
    assert monto_aprox(Decimal("0.3")) == ""


def test_parte_de_tu_dinero():
    assert parte(32.84) == "33 %" and parte(0.4) == "Menos de 1 %" and parte(0) == "0 %"


# ---- Empezar de nuevo ----
def test_reset_borra_solo_lo_tuyo(api):
    a, b = entrar(), entrar()
    for h in (a, b):
        assert api.post("/v1/portfolio/transactions", headers=h,
                        json={"ticker": "ISA", "kind": "buy", "quantity": 5}).status_code == 201
    assert api.post("/v1/portfolio/reset").status_code == 401  # sin sesión
    assert api.post("/v1/portfolio/reset", headers=a).status_code == 204
    assert api.get("/v1/portfolio/transactions", headers=a).json() == []
    assert api.get("/v1/portfolio", headers=a).json()["positions"] == []
    assert len(api.get("/v1/portfolio/transactions", headers=b).json()) == 1  # lo de B intacto


def test_reset_con_portafolio_vacio_no_falla(api):
    assert api.post("/v1/portfolio/reset", headers=entrar()).status_code == 204

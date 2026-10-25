# Dueño: Julian · Pruebas de precios (día 12) e historial (día 15).
# NUNCA llaman a Yahoo: usan un proveedor falso o una tabla falsa en lugar de la descarga.
from datetime import UTC, date, datetime, time, timedelta
from decimal import Decimal

import pandas as pd
import pytest
from sqlmodel import Session, select

from app.clock import COLOMBIA, hoy
from app.core import market_refresh
from app.core.history import portfolio_history
from app.core.market_refresh import mercado_abierto, refresh_if_stale
from app.core.portfolio import Movimiento
from app.core.prices import latest_prices
from app.db import engine
from app.models import IndexSnapshot, PriceSnapshot
from app.providers import yahoo
from app.providers.base import Cierre, Cotizacion, con_cambio
from app.providers.csv import CsvError, CsvProvider
from scripts.backfill_prices import backfill, verificar
from scripts.load_prices import cargar
from tests.conftest import entrar


class ProveedorFalso:
    """Responde lo que le digamos y cuenta cuántas veces le pidieron precios."""

    name = "falso"

    def __init__(self, cotizaciones=None, historia=None, falla=False):
        self.cotizaciones = cotizaciones or {}  # {símbolo: Cotizacion}
        self.historia = historia or {}  # {símbolo: [Cierre]}
        self.falla = falla
        self.llamadas = 0

    def last_prices(self, activos):
        self.llamadas += 1
        if self.falla:
            raise ConnectionError("Yahoo no responde")
        return {t: self.cotizaciones[s] for t, s in activos.items() if s in self.cotizaciones}

    def history(self, activos, start, end):
        return {t: [c for c in self.historia[s] if start <= c.day <= end]
                for t, s in activos.items() if s in self.historia}


def lunes_10am() -> datetime:
    """El próximo lunes a las 10:00 a. m. de Colombia (siempre en el futuro: el seed es de hoy)."""
    dia = datetime.now(COLOMBIA).date() + timedelta(days=1)
    while dia.weekday() != 0:
        dia += timedelta(days=1)
    return datetime.combine(dia, time(10, 0), tzinfo=COLOMBIA)


def precio(session, ticker):
    return {a.ticker: p for a, p in latest_prices(session)}[ticker]


@pytest.fixture(autouse=True)
def _sin_intentos_previos():
    market_refresh.reiniciar_intentos()
    yield
    market_refresh.reiniciar_intentos()


# ---- Horario ----
@pytest.mark.parametrize("dia, hora, abierto", [
    (date(2026, 10, 26), time(10, 0), True),  # lunes
    (date(2026, 10, 30), time(16, 59), True),  # viernes casi al cierre
    (date(2026, 10, 26), time(7, 59), False),  # muy temprano
    (date(2026, 10, 26), time(17, 0), False),  # ya cerró
    (date(2026, 10, 24), time(11, 0), False),  # sábado
    (date(2026, 10, 25), time(11, 0), False),  # domingo
])
def test_horario_del_mercado(dia, hora, abierto):
    assert mercado_abierto(datetime.combine(dia, hora, tzinfo=COLOMBIA)) is abierto


def test_el_horario_es_el_de_colombia_aunque_llegue_en_utc():
    # 15:00 UTC = 10:00 a. m. en Colombia
    assert mercado_abierto(datetime(2026, 10, 26, 15, 0, tzinfo=UTC))


# ---- Actualización de precios ----
def test_actualiza_y_reemplaza_el_precio_de_ejemplo(api):
    viernes = hoy() - timedelta(days=3)  # un día anterior al precio de ejemplo (que es de hoy)
    falso = ProveedorFalso({"ECOPETROL.CL": Cotizacion(viernes, Decimal(2410), 2.55)})
    with Session(engine) as s:
        assert refresh_if_stale(s, falso, lunes_10am()) is True
        p = precio(s, "ECOPETROL")
        # El precio real del viernes gana, aunque el de ejemplo tuviera fecha de hoy.
        assert (p.price, p.change_pct, p.source, p.day) == (Decimal(2410), 2.55, "falso", viernes)
        assert precio(s, "ISA").source == "catalogo"  # las que no llegaron siguen como estaban


def test_no_pide_si_el_precio_es_reciente(api):
    falso = ProveedorFalso({"ECOPETROL.CL": Cotizacion(hoy(), Decimal(2410), 1.0)})
    ahora = lunes_10am()
    with Session(engine) as s:
        assert refresh_if_stale(s, falso, ahora) is True
        assert refresh_if_stale(s, falso, ahora + timedelta(minutes=14)) is False
        assert refresh_if_stale(s, falso, ahora + timedelta(minutes=16)) is True
    assert falso.llamadas == 2


def test_no_pide_con_el_mercado_cerrado(api):
    falso = ProveedorFalso()
    sabado = lunes_10am() - timedelta(days=2)
    with Session(engine) as s:
        assert refresh_if_stale(s, falso, sabado) is False
    assert falso.llamadas == 0


def test_si_yahoo_falla_sigue_con_el_ultimo_precio_y_no_insiste(api):
    falso = ProveedorFalso(falla=True)
    ahora = lunes_10am()
    with Session(engine) as s:
        antes = precio(s, "ECOPETROL").price
        assert refresh_if_stale(s, falso, ahora) is False  # no lanza error
        assert precio(s, "ECOPETROL").price == antes
        assert refresh_if_stale(s, falso, ahora + timedelta(minutes=5)) is False
    assert falso.llamadas == 1  # no reintenta en cada petición


def test_el_colcap_va_a_su_propia_tabla(api):
    falso = ProveedorFalso({"ICOLCAP.CL": Cotizacion(hoy(), Decimal("25200.5"), 0.35)})
    with Session(engine) as s:
        refresh_if_stale(s, falso, lunes_10am())
        filas = s.exec(select(IndexSnapshot)).all()
        assert [(f.points, f.source) for f in filas] == [(Decimal("25200.5"), "falso")]


def test_las_rutas_no_fallan_sin_proveedor(api):
    # En las pruebas PRICE_PROVIDER=off: las rutas llaman a refresh_if_stale sin tocar Yahoo.
    assert api.get("/v1/market/assets").status_code == 200
    assert api.get("/v1/market/colcap").status_code == 200


# ---- Lectura de Yahoo (con una tabla falsa en lugar de la descarga) ----
def tabla_yahoo(datos: dict[str, list[float]], dias: list[str], simbolo_primero=True):
    columnas, valores = [], []
    for simbolo, cierres in datos.items():
        columnas += [(simbolo, "Open"), (simbolo, "Close")]
        valores += [cierres, cierres]
    if not simbolo_primero:
        columnas = [(dato, simbolo) for simbolo, dato in columnas]
    return pd.DataFrame(dict(zip(columnas, valores, strict=True)), index=pd.to_datetime(dias))


@pytest.mark.parametrize("simbolo_primero", [True, False])
def test_yahoo_saca_el_ultimo_precio_y_su_cambio(monkeypatch, simbolo_primero):
    tabla = tabla_yahoo({"ECOPETROL.CL": [2300.0, 2350.0, float("nan")], "ISA.CL": [21000.0, 21420.0, 21800.0]},
                        ["2026-10-21", "2026-10-22", "2026-10-23"], simbolo_primero)
    monkeypatch.setattr(yahoo, "_descargar", lambda simbolos, **kw: tabla)
    r = yahoo.YahooProvider().last_prices({"ECOPETROL": "ECOPETROL.CL", "ISA": "ISA.CL",
                                           "MINEROS": "MINEROS.CL"})
    assert r["ECOPETROL"].day == date(2026, 10, 22)  # el día vacío (NaN) se ignora
    assert round(r["ECOPETROL"].change_pct, 2) == 2.17
    assert r["ISA"].price == Decimal(21800) and round(r["ISA"].change_pct, 2) == 1.77
    assert "MINEROS" not in r  # el que no vino, no sale


def test_cambio_del_dia_desde_cierres():
    c = con_cambio([Cierre(date(2026, 10, 1), Decimal(100)), Cierre(date(2026, 10, 2), Decimal(110))])
    assert len(c) == 1 and c[0].change_pct == 10.0


# ---- CSV de respaldo ----
def escribir(tmp_path, texto):
    ruta = tmp_path / "precios.csv"
    ruta.write_text(texto, encoding="utf-8")
    return ruta


def test_cargar_csv_con_colcap(api, tmp_path):
    ruta = escribir(tmp_path, "fecha,ticker,precio,cambio_pct\n"
                              "2026-10-22,COLCAP,1801.6,-0.3\n2026-10-23,ecopetrol,2399,2.1\n")
    with Session(engine) as s:
        assert cargar(s, ruta) == 2
        assert precio(s, "ECOPETROL").price == Decimal(2399)
        assert s.exec(select(IndexSnapshot).where(IndexSnapshot.source == "csv")).one().points == Decimal("1801.6")


@pytest.mark.parametrize("texto, mensaje", [
    ("dia,ticker,precio,cambio\n", "encabezado"),
    ("fecha,ticker,precio,cambio_pct\n2026-13-01,ISA,1,0\n", "Fila 2"),
    ("fecha,ticker,precio,cambio_pct\n2026-10-01,ISA,0,0\n", "mayor que 0"),
])
def test_csv_mal_formado_no_carga_nada(tmp_path, texto, mensaje):
    with pytest.raises(CsvError, match=mensaje):
        CsvProvider(escribir(tmp_path, texto))


def test_csv_con_ticker_desconocido_no_carga_nada(api, tmp_path):
    ruta = escribir(tmp_path, "fecha,ticker,precio,cambio_pct\n2026-10-23,ISA,1,0\n2026-10-23,NOEXISTE,1,0\n")
    with Session(engine) as s, pytest.raises(CsvError, match="NOEXISTE"):
        cargar(s, ruta)
    with Session(engine) as s:
        assert precio(s, "ISA").source == "catalogo"


# ---- Backfill y verificación ----
def serie(desde: date, dias: int, inicio: float, paso: float) -> list[Cierre]:
    return [Cierre(desde + timedelta(days=i), Decimal(str(inicio + i * paso))) for i in range(dias)]


def test_backfill_guarda_un_anio_sin_duplicar(api):
    hasta = hoy()
    inicio = hasta - timedelta(days=380)
    falso = ProveedorFalso(historia={"ISA.CL": serie(inicio, 381, 20000, 5),
                                     "^COLCAP": serie(inicio, 381, 1700, 0.5)})
    activos = {"ISA": "ISA.CL", "COLCAP": "^COLCAP", "MINEROS": "MINEROS.CL"}
    with Session(engine) as s:
        conteo = backfill(s, falso, activos, hasta)
        assert conteo == {"ISA": 366, "COLCAP": 366, "MINEROS": 0}
        backfill(s, falso, activos, hasta)  # repetir no duplica
        filas = s.exec(select(PriceSnapshot).where(PriceSnapshot.ticker == "ISA")).all()
        assert len(filas) == 366 and {f.source for f in filas} == {"falso"}  # sin el de ejemplo
        assert precio(s, "ISA").change_pct > 0


def test_verificar_prueba_un_simbolo_alternativo():
    falso = ProveedorFalso({"PFCIBEST.CL": Cotizacion(date(2026, 10, 23), Decimal(40000), 0.5)})
    r = verificar(falso, {"PFBCOLOM": "PFBCOLOM.CL", "GEB": "GEB.CL"})
    assert r["PFBCOLOM"][0] == "PFCIBEST.CL" and r["PFBCOLOM"][1].price == Decimal(40000)
    assert r["GEB"] == ("GEB.CL", None)


# ---- Historial del portafolio ----
D1, D2, D3 = date(2026, 10, 1), date(2026, 10, 2), date(2026, 10, 3)


def compra(q, p, d, i, t="ISA"):
    return Movimiento(t, "buy", Decimal(q), Decimal(p), d, i)


def test_historial_del_portafolio_ejemplo_de_la_guia():
    cierres = {"ISA": [Cierre(D1, Decimal(1000)), Cierre(D2, Decimal(1050)), Cierre(D3, Decimal(1100))]}
    puntos = portfolio_history([compra(10, 1000, D1, 1)], cierres, D1, D3)
    assert [(p.day, p.value, p.invested) for p in puntos][-1] == (D3, 11000, 10000)
    assert len(puntos) == 3


def test_historial_empieza_en_tu_primera_compra_y_rellena_dias_sin_precio():
    cierres = {"ISA": [Cierre(D1, Decimal(1000)), Cierre(D3, Decimal(1200))],
               "CELSIA": [Cierre(D2, Decimal(500))]}
    puntos = portfolio_history([compra(10, 1000, D2, 1)], cierres, D1, D3)
    assert [p.day for p in puntos] == [D2, D3]  # el 1 todavía no tenías nada
    assert puntos[0].value == 10000  # el 2 ISA no tuvo precio: se usa el del día 1


def test_historial_con_ventas_usa_costo_promedio():
    movs = [compra(100, 2000, D1, 1), compra(100, 3000, D2, 2),
            Movimiento("ISA", "sell", Decimal(50), Decimal(3000), D3, 3)]
    cierres = {"ISA": [Cierre(d, Decimal(3000)) for d in (D1, D2, D3)]}
    ultimo = portfolio_history(movs, cierres, D1, D3)[-1]
    assert ultimo.invested == 375000 and ultimo.value == 450000  # 150 × $2.500 y 150 × $3.000


# ---- Rutas de historial ----
def test_ruta_historial_de_una_accion(api):
    r = api.get("/v1/market/assets/ecopetrol/history?range=3m")
    assert r.status_code == 200 and r.json()[-1]["price"] == 2350
    assert api.get("/v1/market/assets/NOEXISTE/history").status_code == 404
    assert api.get("/v1/market/assets/ISA/history?range=5y").status_code == 422


def test_ruta_historial_del_portafolio(api):
    assert api.get("/v1/portfolio/history").status_code == 401
    h = entrar()
    api.post("/v1/portfolio/transactions", headers=h, json={"ticker": "ISA", "kind": "buy", "quantity": 10})
    puntos = api.get("/v1/portfolio/history?range=1y", headers=h).json()
    assert puntos[-1] == {"day": hoy().isoformat(), "value": 218000.0, "invested": 218000.0}
    assert api.get("/v1/portfolio/history", headers=entrar()).json() == []  # sin portafolio


# ---- El COLCAP desde el fondo ICOLCAP ----
def test_el_colcap_de_yahoo_se_marca_como_fondo(api):
    assert api.get("/v1/market/colcap").json()["proxy"] is False  # el de ejemplo son puntos
    with Session(engine) as s:
        guardar = market_refresh.guardar_cotizaciones
        guardar(s, [("COLCAP", Cotizacion(hoy(), Decimal("25200.5"), 0.35))], "yahoo")
    r = api.get("/v1/market/colcap").json()
    assert r["proxy"] is True and r["points"] == 25200.5
    h = entrar()
    api.post("/v1/portfolio/transactions", headers=h, json={"ticker": "ISA", "kind": "buy", "quantity": 10})
    hoy_ = api.get("/v1/today", headers=h).json()
    assert hoy_["colcap"]["proxy"] is True
    assert "subió cerca de 0,4 %" in hoy_["fallback"]["vs_colcap"]  # el % del fondo es aproximado


def test_el_colcap_por_csv_son_puntos():
    assert market_refresh.colcap_es_fondo("csv") is False
    assert market_refresh.colcap_es_fondo("yahoo") is True

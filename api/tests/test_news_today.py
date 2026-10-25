# Dueño: Julian · Pruebas de Noticias (día 10) y de la ruta de Hoy (día 11).
from datetime import date

from sqlmodel import Session, SQLModel, select

from app.db import engine
from app.models import NewsItem
from scripts.seed_db import seed
from tests.conftest import entrar

EJEMPLO = {"ECOPETROL": 1200, "PFBCOLOM": 60, "ISA": 90, "GRUPOSURA": 40}


def armar(api, h, cantidades=EJEMPLO):
    for t, q in cantidades.items():
        r = api.post("/v1/portfolio/transactions", headers=h,
                     json={"ticker": t, "kind": "buy", "quantity": q})
        assert r.status_code == 201


def titulos(noticias):
    return [n["title"] for n in noticias]


# ---- Sesión obligatoria ----
def test_noticias_y_hoy_piden_sesion(api):
    assert api.get("/v1/news").status_code == 401
    assert api.get("/v1/today").status_code == 401


# ---- Noticias ----
def test_seed_carga_11_noticias_sin_duplicar():
    SQLModel.metadata.create_all(engine)
    with Session(engine) as session:
        seed(session, date(2026, 10, 21))
        assert seed(session, date(2026, 10, 22))["noticias"] == 11
        petroleo = session.exec(select(NewsItem).where(NewsItem.ticker == "ECOPETROL")).first()
        assert petroleo.cause == "el precio del petróleo bajó"
        assert petroleo.why.startswith("Si el petróleo baja")


def test_mis_noticias_por_impacto_por_parte_de_mi_dinero(api):
    h = entrar()
    armar(api, h)
    r = api.get("/v1/news", headers=h).json()
    # petróleo (grande × 32,8) · ISA (grande × 22,9) · Bancolombia (mediano × 26,8)
    # · Grupo Sura (mediano × 17,5) · Ecopetrol produce más (pequeño × 32,8)
    assert [n["ticker"] for n in r] == ["ECOPETROL", "ISA", "PFBCOLOM", "GRUPOSURA", "ECOPETROL"]
    assert r[0]["title"] == "El petróleo baja de precio y Ecopetrol lo siente"
    assert round(r[0]["weight_pct"], 1) == 32.8 and r[0]["asset_name"] == "Ecopetrol"
    assert r[0]["why"] and r[0]["watch"] == "El precio del petróleo."


def test_filtros_de_noticias(api):
    h = entrar()
    armar(api, h)
    grandes = api.get("/v1/news?impact=Alta", headers=h).json()
    assert {n["magnitude"] for n in grandes} == {"Alta"} and len(grandes) == 2
    malas = api.get("/v1/news?direction=Negativo", headers=h).json()
    assert [n["id"] for n in malas] == [grandes[0]["id"]]  # solo la del petróleo
    assert api.get("/v1/news?impact=Enorme", headers=h).status_code == 422


def test_todas_las_noticias_con_mine_false(api):
    h = entrar()
    armar(api, h, {"ISA": 10})
    todas = api.get("/v1/news?mine=false", headers=h).json()
    assert len(todas) == 11 and todas[0]["ticker"] == "ISA"  # las tuyas primero
    assert api.get("/v1/news", headers=entrar()).json() == []  # sin portafolio, nada tuyo


def test_mercado_trae_que_mueve_a_cada_accion(api):
    eco = next(a for a in api.get("/v1/market/assets").json() if a["ticker"] == "ECOPETROL")
    assert eco["drivers"].startswith("La mueven el precio del petróleo")


# ---- Hoy ----
def test_hoy_dice_lo_mismo_que_el_prototipo(api):
    h = entrar()
    armar(api, h)
    r = api.get("/v1/today", headers=h).json()
    assert r["has_portfolio"] and r["direction"] == "up"
    assert r["headline"] == "Hoy tu portafolio subió 0,1 %, unos $5.800 más"
    assert r["explanation"][0] == ("La que más pesó fue Ecopetrol, que bajó porque el precio del "
                                   "petróleo bajó.")
    assert r["top_asset"]["ticker"] == "ECOPETROL"
    assert r["top_asset"]["cause"] == "el precio del petróleo bajó"
    assert round(r["top_asset"]["effect"]) == -40041
    assert r["colcap"]["line"] == ("Hoy las acciones más grandes del país subieron un poco. "
                                   "A tu portafolio le fue peor.")
    assert titulos(r["news"])[0] == "El petróleo baja de precio y Ecopetrol lo siente"
    assert len(r["news"]) == 3
    assert r["fallback"]["vs_colcap"].endswith("Hoy le fue peor que al COLCAP.")
    assert r["updated_at"] is not None


def test_hoy_sin_portafolio(api):
    r = api.get("/v1/today", headers=entrar()).json()
    assert r["has_portfolio"] is False and r["headline"] is None and r["news"] == []
    assert r["colcap"]["line"] == "Hoy las acciones más grandes del país subieron un poco."


def test_hoy_no_mezcla_portafolios(api):
    a, b = entrar(), entrar()
    armar(api, a)
    armar(api, b, {"MINEROS": 100})
    assert api.get("/v1/today", headers=b).json()["top_asset"]["ticker"] == "MINEROS"
    assert api.get("/v1/today", headers=a).json()["top_asset"]["ticker"] == "ECOPETROL"

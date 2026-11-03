"""Prueba de los textos del servidor (Isabela, días 2, 4, 8 y 15).

Revisa que estén todos (10 acciones, 11 noticias, 10 textos de «qué mueve», 9 causas),
que ninguno recomiende y que coincidan con los datos provisionales que ya usa la API.
"""

import json
from pathlib import Path

from app.content.catalog import ASSETS, COLCAP, EXAMPLE_PORTFOLIO
from app.content.causes import CAUSES
from app.content.drivers import DRIVER_DEFAULT, DRIVERS
from app.content.news_seed import NEWS
from app.content.radar_texts import RADAR
from scripts import provisional_catalog, provisional_content

TICKERS = {a["ticker"] for a in ASSETS}
NEWS_IDS = {n["id"] for n in NEWS}
PROHIBIDAS = ("compra ", "compre", "vende ", "venda", "aprovecha", "deberías", "te recomiendo",
              "mantén")


def test_hay_10_acciones_y_11_noticias():
    assert len(ASSETS) == 10 and len(TICKERS) == 10
    assert len(NEWS) == 11 and len(NEWS_IDS) == 11
    assert {n["ticker"] for n in NEWS} <= TICKERS


def test_hay_10_textos_de_que_mueve_y_9_causas():
    assert set(DRIVERS) == TICKERS
    assert DRIVER_DEFAULT
    assert len(CAUSES) == 9 and set(CAUSES) <= NEWS_IDS


def test_cada_noticia_tiene_por_que_te_afecta_y_que_mirar():
    assert set(RADAR) == NEWS_IDS
    assert all(por_que and que_mirar for por_que, que_mirar in RADAR.values())


def test_portafolio_de_ejemplo_vale_8586000():
    precios = {a["ticker"]: a["price"] for a in ASSETS}
    assert sum(precios[t] * n for t, n in EXAMPLE_PORTFOLIO) == 8_586_000
    assert COLCAP["points"] == "1812.40" and COLCAP["change"] == 0.6


def test_ningun_texto_recomienda():
    textos = list(DRIVERS.values()) + list(CAUSES.values()) + [DRIVER_DEFAULT]
    textos += [t for par in RADAR.values() for t in par]
    textos += [n["title"] for n in NEWS] + [n["summary"] for n in NEWS]
    for texto in textos:
        for palabra in PROHIBIDAS:
            assert palabra not in texto.lower(), f"«{palabra}» en: {texto}"


def test_igual_a_los_datos_provisionales_de_julian():
    """Así Julian puede cambiar el import sin que cambie nada en la API."""
    assert ASSETS == provisional_catalog.ASSETS
    assert COLCAP == provisional_catalog.COLCAP
    assert NEWS == provisional_content.NEWS
    assert CAUSES == provisional_content.CAUSES
    assert RADAR == provisional_content.RADAR
    assert DRIVERS == provisional_content.DRIVERS
    assert DRIVER_DEFAULT == provisional_content.DRIVER_DEFAULT


def test_banco_de_preguntas_ia():
    ruta = Path(__file__).resolve().parents[1] / "app" / "content" / "preguntas_ia.json"
    preguntas = json.loads(ruta.read_text(encoding="utf-8"))
    assert len(preguntas) == 40
    assert sum(p["pide_recomendacion"] for p in preguntas) == 20
    textos = [p["pregunta"] for p in preguntas]
    assert len(set(textos)) == 40, "hay preguntas repetidas"

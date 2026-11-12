# Pruebas del cargador de noticias reales y del CSV que viene en el repo.
from pathlib import Path

import pytest
from sqlmodel import Session, select

from app.ai.guardrails import violates_rules
from scripts.load_news import CSV_POR_DEFECTO, NoticiaError, cargar, leer


def test_el_csv_del_repo_es_valido_y_no_recomienda(api):
    from app.db import engine
    from app.models import Asset
    with Session(engine) as s:
        filas = leer(CSV_POR_DEFECTO, set(s.exec(select(Asset.ticker)).all()))
    assert len(filas) >= 15
    for f in filas:
        assert not violates_rules(f"{f['title']} {f['summary']} {f['why']} {f['watch']}"), f["title"]


def test_carga_quita_ejemplos_y_no_duplica(api):
    from app.db import engine
    from app.models import NewsItem
    with Session(engine) as s:
        r1 = cargar(s, CSV_POR_DEFECTO, quitar_ejemplos=True)
        r2 = cargar(s, CSV_POR_DEFECTO)
        fuentes = {n.source for n in s.exec(select(NewsItem))}
    assert r1["nuevas"] >= 15 and r1["ejemplos_borrados"] > 0
    assert r2["nuevas"] == 0 and r2["actualizadas"] == r1["nuevas"]
    assert "Resumen de mercado" not in fuentes


def test_fila_mala_no_carga_nada(tmp_path: Path):
    malo = tmp_path / "malo.csv"
    malo.write_text(CSV_POR_DEFECTO.read_text(encoding="utf-8").splitlines()[0]
                    + "\n2026-13-01,ECOPETROL,Positivo,Alta,t,e,,,,,\n", encoding="utf-8")
    with pytest.raises(NoticiaError, match="Fila 2"):
        leer(malo, {"ECOPETROL"})

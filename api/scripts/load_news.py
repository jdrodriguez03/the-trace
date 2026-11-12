# Dueño: Julian · Carga noticias reales desde un CSV (por defecto app/content/noticias_reales.csv).
# Uso (desde api/):
#   uv run python -m scripts.load_news                         # carga o actualiza las del CSV
#   uv run python -m scripts.load_news --quitar-ejemplos       # además borra las 11 de ejemplo
# Una noticia se reconoce por acción y título: correrlo dos veces no la duplica, la actualiza.
# Si una fila está mal, no carga nada y dice cuál.
import argparse
import csv
from datetime import date
from pathlib import Path

from sqlmodel import Session, select

from app.db import engine
from app.models import Asset, NewsItem

CSV_POR_DEFECTO = Path(__file__).resolve().parent.parent / "app" / "content" / "noticias_reales.csv"
COLUMNAS = ["fecha", "ticker", "tipo", "impacto", "titulo", "explicacion", "por_que_te_afecta",
            "que_mirar", "causa", "fuente", "url"]
TIPOS = {"Positivo", "Negativo", "Neutro"}
IMPACTOS = {"Alta", "Media", "Baja"}
FUENTE_EJEMPLO = "Resumen de mercado"  # así quedaron las noticias de ejemplo de seed_db


class NoticiaError(ValueError):
    pass


def leer(ruta: Path, tickers: set[str]) -> list[dict]:
    filas = []
    with open(ruta, encoding="utf-8-sig", newline="") as f:
        lector = csv.DictReader(f)
        if [c.strip().lower() for c in (lector.fieldnames or [])] != COLUMNAS:
            raise NoticiaError(f"El encabezado debe ser exactamente: {','.join(COLUMNAS)}")
        for n, fila in enumerate(lector, start=2):
            f = {k: (v or "").strip() for k, v in fila.items()}
            try:
                dia = date.fromisoformat(f["fecha"])
            except ValueError:
                raise NoticiaError(f"Fila {n}: la fecha va como AAAA-MM-DD.") from None
            ticker = f["ticker"].upper()
            if ticker not in tickers:
                raise NoticiaError(f"Fila {n}: la acción {ticker} no existe en The Trace.")
            if f["tipo"] not in TIPOS or f["impacto"] not in IMPACTOS:
                raise NoticiaError(f"Fila {n}: tipo debe ser {TIPOS} e impacto {IMPACTOS}.")
            if not f["titulo"] or not f["explicacion"]:
                raise NoticiaError(f"Fila {n}: faltan el título o la explicación.")
            filas.append({"day": dia, "ticker": ticker, "direction": f["tipo"],
                          "magnitude": f["impacto"], "title": f["titulo"][:200],
                          "summary": f["explicacion"][:500], "why": f["por_que_te_afecta"][:500],
                          "watch": f["que_mirar"][:300], "cause": f["causa"][:200] or None,
                          "source": f["fuente"][:100] or "The Trace", "url": f["url"][:500] or None})
    return filas


def cargar(session: Session, ruta: Path, quitar_ejemplos: bool = False) -> dict[str, int]:
    tickers = set(session.exec(select(Asset.ticker)).all())
    filas = leer(ruta, tickers)
    borradas = 0
    if quitar_ejemplos:
        for n in session.exec(select(NewsItem).where(NewsItem.source == FUENTE_EJEMPLO)):
            session.delete(n)
            borradas += 1
    nuevas = actualizadas = 0
    for f in filas:
        n = session.exec(select(NewsItem).where(NewsItem.ticker == f["ticker"],
                                                NewsItem.title == f["title"])).first()
        if n is None:
            session.add(NewsItem(**f))
            nuevas += 1
        else:
            for k, v in f.items():
                setattr(n, k, v)
            session.add(n)
            actualizadas += 1
    session.commit()
    return {"nuevas": nuevas, "actualizadas": actualizadas, "ejemplos_borrados": borradas}


def main() -> None:
    p = argparse.ArgumentParser(description="Carga noticias reales desde un CSV.")
    p.add_argument("archivo", nargs="?", default=str(CSV_POR_DEFECTO))
    p.add_argument("--quitar-ejemplos", action="store_true",
                   help="Borra las noticias de ejemplo (fuente «Resumen de mercado»).")
    a = p.parse_args()
    try:
        with Session(engine) as s:
            r = cargar(s, Path(a.archivo), a.quitar_ejemplos)
    except (NoticiaError, FileNotFoundError) as e:
        raise SystemExit(f"No se cargó nada. {e}") from None
    print(f"Listo: {r['nuevas']} nuevas, {r['actualizadas']} actualizadas, "
          f"{r['ejemplos_borrados']} de ejemplo borradas.")


if __name__ == "__main__":
    main()

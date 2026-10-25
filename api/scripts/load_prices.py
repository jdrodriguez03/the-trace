# Dueño: Julian · Carga precios desde un CSV: el respaldo si Yahoo falla o no tiene un símbolo.
# Uso (desde api/):  uv run python -m scripts.load_prices scripts/ejemplos/precios.csv
# Formato: fecha,ticker,precio,cambio_pct  (ver app/providers/csv.py). Para el índice, ticker COLCAP.
# Si una fila está mal o un ticker no existe, no carga nada y dice cuál es el problema.
import sys

from sqlmodel import Session, select

from app.core.market_refresh import CODIGO_COLCAP, guardar_cotizaciones
from app.db import engine
from app.models import Asset
from app.providers.csv import CsvError, leer_csv


def cargar(session: Session, ruta: str) -> int:
    filas = leer_csv(ruta)
    conocidos = set(session.exec(select(Asset.ticker)).all()) | {CODIGO_COLCAP}
    desconocidos = sorted({t for t, _ in filas} - conocidos)
    if desconocidos:
        raise CsvError(f"Estos tickers no existen en The Trace: {', '.join(desconocidos)}")
    return guardar_cotizaciones(session, filas, "csv")


def main() -> None:
    if len(sys.argv) != 2:
        sys.exit("Uso: uv run python -m scripts.load_prices archivo.csv")
    try:
        with Session(engine) as session:
            n = cargar(session, sys.argv[1])
    except (CsvError, FileNotFoundError) as e:
        sys.exit(f"No se cargó nada. {e}")
    print(f"Listo: {n} precios cargados desde {sys.argv[1]}.")


if __name__ == "__main__":
    main()

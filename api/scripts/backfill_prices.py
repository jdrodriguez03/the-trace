# Dueño: Julian · Baja de Yahoo el cierre diario del último año (de ahí salen las gráficas).
# Uso (desde api/):
#   uv run python -m scripts.backfill_prices --verificar   # 1. comprueba cada símbolo en Yahoo
#   uv run python -m scripts.backfill_prices               # 2. guarda el último año en la base
# Se puede correr varias veces: actualiza las filas que ya existen, no las duplica.
import argparse
from datetime import date, timedelta

from sqlmodel import Session

from app.clock import hoy
from app.core.market_refresh import CODIGO_COLCAP, activos_a_pedir, guardar_cotizaciones
from app.db import engine
from app.providers.base import Activos, Cotizacion, PriceProvider, con_cambio

DIAS = 365
# Otros símbolos que vale la pena probar si el principal no aparece en Yahoo. SIN VERIFICAR:
# Bancolombia pudo cambiar de símbolo con su reorganización como Grupo Cibest, y el COLCAP no
# tiene un símbolo confirmado. --verificar dice cuál funciona.
ALTERNATIVAS = {
    "PFBCOLOM": ["PFCIBEST.CL", "CIBEST.CL"],
    CODIGO_COLCAP: ["^COLCAP", "COLCAP.CL", "^COLCAP.CL"],
}


def verificar(provider: PriceProvider, activos: Activos) -> dict[str, tuple[str, Cotizacion | None]]:
    """Para cada activo: el símbolo que funcionó (o el original) y su último precio (o None)."""
    encontrados = provider.last_prices(activos)
    resultado: dict[str, tuple[str, Cotizacion | None]] = {
        t: (s, encontrados.get(t)) for t, s in activos.items()
    }
    for ticker, (simbolo, cot) in resultado.items():
        if cot is not None:
            continue
        for otro in ALTERNATIVAS.get(ticker, []):
            if otro == simbolo:
                continue
            prueba = provider.last_prices({ticker: otro}).get(ticker)
            if prueba is not None:
                resultado[ticker] = (otro, prueba)
                break
    return resultado


def backfill(session: Session, provider: PriceProvider, activos: Activos, hasta: date,
             dias: int = DIAS) -> dict[str, int]:
    """Guarda los cierres de los últimos `dias`. Devuelve cuántos días guardó por activo."""
    # 10 días de más al principio: el primer día del año también necesita su cambio del día.
    cierres = provider.history(activos, hasta - timedelta(days=dias + 10), hasta)
    desde = hasta - timedelta(days=dias)
    filas = [(t, c) for t, serie in cierres.items() for c in con_cambio(serie) if c.day >= desde]
    guardar_cotizaciones(session, filas, provider.name)
    conteo = dict.fromkeys(activos, 0)
    for t, _ in filas:
        conteo[t] += 1
    return conteo


def _cop(valor) -> str:
    return f"${float(valor):,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")


def main() -> None:
    parser = argparse.ArgumentParser(description="Precios del último año desde Yahoo Finance.")
    parser.add_argument("--verificar", action="store_true",
                        help="solo comprueba los símbolos, no guarda nada")
    args = parser.parse_args()

    from app.providers.yahoo import YahooProvider

    provider = YahooProvider()
    with Session(engine) as session:
        activos = activos_a_pedir(session)

        if args.verificar:
            print(f"{'Ticker':<11} {'Símbolo':<14} {'Último precio':>15}  Fecha       Estado")
            faltan = []
            for ticker, (simbolo, cot) in verificar(provider, activos).items():
                if cot is None:
                    faltan.append(ticker)
                    print(f"{ticker:<11} {simbolo:<14} {'—':>15}  {'—':<10}  ✘ no aparece")
                    continue
                cambio = " (símbolo alternativo)" if simbolo != activos[ticker] else ""
                print(f"{ticker:<11} {simbolo:<14} {_cop(cot.price):>15}  {cot.day}  ✔{cambio}")
            if faltan:
                print(f"\nNo aparecen en Yahoo: {', '.join(faltan)}. Cópiale esta tabla a Julian.")
            else:
                print("\nTodos los símbolos funcionan. Ya puedes correr el backfill sin --verificar.")
            return

        conteo = backfill(session, provider, activos, hoy())
    print("Días guardados por activo:")
    for ticker, n in conteo.items():
        print(f"  {ticker:<11} {n:>4}" + ("   ✘ sin datos" if n == 0 else ""))
    if conteo.get(CODIGO_COLCAP, 0) == 0:
        print("\nEl COLCAP no vino de Yahoo: cárgalo con `uv run python -m scripts.load_prices "
              "archivo.csv` (formato en scripts/ejemplos/precios.csv).")


if __name__ == "__main__":
    main()

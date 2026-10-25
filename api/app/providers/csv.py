# Dueño: Julian · Respaldo: precios desde un CSV, para cuando Yahoo falle o no tenga un símbolo.
# Formato (con encabezado):  fecha,ticker,precio,cambio_pct
#   2026-10-23,ECOPETROL,2350,-1.4
#   2026-10-23,COLCAP,1812.4,0.6
# La fecha va como AAAA-MM-DD y los decimales con punto. El CSV usa el ticker, no el símbolo de Yahoo.
import csv
from datetime import date
from decimal import Decimal, InvalidOperation
from pathlib import Path

from app.providers.base import Activos, Cierre, Cotizacion

COLUMNAS = ["fecha", "ticker", "precio", "cambio_pct"]


class CsvError(ValueError):
    """El CSV tiene un problema. El mensaje dice en qué fila."""


def leer_csv(ruta: str | Path) -> list[tuple[str, Cotizacion]]:
    """Lee y valida todo el archivo. Si una fila está mal, falla diciendo cuál: mejor no cargar
    nada que cargar la mitad."""
    filas = []
    with open(ruta, encoding="utf-8-sig", newline="") as f:  # -sig: tolera el BOM de Excel
        lector = csv.DictReader(f)
        if [c.strip().lower() for c in (lector.fieldnames or [])] != COLUMNAS:
            raise CsvError(f"El encabezado debe ser exactamente: {','.join(COLUMNAS)}")
        for n, fila in enumerate(lector, start=2):  # la fila 1 es el encabezado
            try:
                dia = date.fromisoformat(fila["fecha"].strip())
                precio = Decimal(fila["precio"].strip())
                cambio = float(fila["cambio_pct"].strip())
            except (ValueError, InvalidOperation, AttributeError) as e:
                raise CsvError(f"Fila {n}: no se pudo leer ({e}).") from e
            if precio <= 0:
                raise CsvError(f"Fila {n}: el precio debe ser mayor que 0.")
            ticker = fila["ticker"].strip().upper()
            filas.append((ticker, Cotizacion(day=dia, price=precio, change_pct=cambio)))
    return filas


class CsvProvider:
    name = "csv"

    def __init__(self, ruta: str | Path) -> None:
        self.filas = leer_csv(ruta)

    def last_prices(self, activos: Activos) -> dict[str, Cotizacion]:
        salida: dict[str, Cotizacion] = {}
        for ticker, cot in self.filas:
            if ticker in activos and (ticker not in salida or cot.day > salida[ticker].day):
                salida[ticker] = cot
        return salida

    def history(self, activos: Activos, start: date, end: date) -> dict[str, list[Cierre]]:
        salida: dict[str, list[Cierre]] = {}
        for ticker, cot in sorted(self.filas, key=lambda f: f[1].day):
            if ticker in activos and start <= cot.day <= end:
                salida.setdefault(ticker, []).append(Cierre(day=cot.day, price=cot.price))
        return salida

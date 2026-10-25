# Dueño: Julian · Lo que debe saber hacer cualquier fuente de precios.
# Yahoo, el CSV de respaldo y el proveedor falso de las pruebas cumplen este mismo contrato.
# En la v2, cambiar a un proveedor con licencia es escribir otro archivo con estas dos funciones.
from dataclasses import dataclass
from datetime import date
from decimal import Decimal
from itertools import pairwise
from typing import Protocol

# Lo que se le pide a un proveedor: {ticker: símbolo en esa fuente}.
# Ejemplo: {"ECOPETROL": "ECOPETROL.CL", "COLCAP": "^COLCAP"}. La respuesta viene por ticker.
Activos = dict[str, str]


@dataclass
class Cotizacion:
    """El último precio de una acción (o del COLCAP) y cuánto cambió frente al cierre anterior."""

    day: date
    price: Decimal
    change_pct: float


@dataclass
class Cierre:
    day: date
    price: Decimal


class PriceProvider(Protocol):
    name: str  # se guarda como "fuente" de cada precio: "yahoo", "csv"…

    def last_prices(self, activos: Activos) -> dict[str, Cotizacion]:
        """El precio más reciente de cada activo. Los que no encuentre, no salen."""
        ...

    def history(self, activos: Activos, start: date, end: date) -> dict[str, list[Cierre]]:
        """Los cierres diarios entre start y end (ambos incluidos), del más viejo al más nuevo."""
        ...


def con_cambio(cierres: list[Cierre]) -> list[Cotizacion]:
    """Convierte una serie de cierres en cotizaciones con su cambio frente al día anterior.

    El primer cierre no tiene día anterior para comparar, así que no sale: por eso quien pide
    historial pide unos días de más al principio.
    """
    salida = []
    for antes, hoy in pairwise(cierres):
        cambio = float((hoy.price / antes.price - 1) * 100) if antes.price else 0.0
        salida.append(Cotizacion(day=hoy.day, price=hoy.price, change_pct=round(cambio, 4)))
    return salida

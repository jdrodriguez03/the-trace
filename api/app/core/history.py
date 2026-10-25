# Dueño: Julian · La gráfica «Cómo ha ido tu portafolio»: valor frente a lo invertido, día a día.
# Función pura: recibe tus movimientos y los cierres de cada acción, y no toca la base.
from collections import defaultdict
from dataclasses import dataclass
from datetime import date, timedelta
from decimal import Decimal

from app.core.portfolio import CERO, Movimiento, aplicar_movimiento, en_orden
from app.providers.base import Cierre

RANGOS = {"1m": 30, "3m": 91, "1y": 365}  # los botones 1M, 3M y 1A de la gráfica


def desde_para(rango: str, hasta: date) -> date:
    return hasta - timedelta(days=RANGOS[rango])


@dataclass
class PuntoHistorial:
    day: date
    value: Decimal  # lo que valían ese día las acciones que tenías ese día
    invested: Decimal  # lo que habías pagado por esas acciones (costo promedio × cantidad)


def portfolio_history(movimientos: list[Movimiento], cierres: dict[str, list[Cierre]],
                      desde: date, hasta: date) -> list[PuntoHistorial]:
    """Un punto por cada día con precios entre desde y hasta, a partir de tu primera compra.

    - El valor usa el cierre de ese día. Si una acción no tuvo precio ese día (festivo, dato que
      falta), se usa su último cierre conocido; si nunca tuvo, el precio al que la compraste.
    - Lo invertido sigue la misma regla de costo promedio que el resumen del portafolio.
    `cierres` puede traer días anteriores a `desde`: sirven para tener un «último precio» al empezar.
    """
    movs = en_orden(movimientos)
    if not movs:
        return []
    dias = sorted({c.day for serie in cierres.values() for c in serie if desde <= c.day <= hasta})
    series = {t: sorted(s, key=lambda c: c.day) for t, s in cierres.items()}

    cantidad: dict[str, Decimal] = defaultdict(Decimal)
    costo: dict[str, Decimal] = defaultdict(Decimal)
    realizada: dict[str, Decimal] = defaultdict(Decimal)
    precio_compra: dict[str, Decimal] = {}  # respaldo si una acción no tiene cierres
    ultimo_cierre: dict[str, Decimal] = {}
    pos_mov = 0
    pos_cierre = dict.fromkeys(series, 0)

    puntos = []
    for dia in dias:
        # 1. Los movimientos hasta ese día (incluido).
        while pos_mov < len(movs) and movs[pos_mov].day <= dia:
            m = movs[pos_mov]
            aplicar_movimiento(m, cantidad, costo, realizada)
            precio_compra[m.ticker] = m.price
            pos_mov += 1
        if pos_mov == 0:
            continue  # todavía no habías comprado nada: no hay nada que graficar

        # 2. El último cierre conocido de cada acción hasta ese día.
        for t, serie in series.items():
            while pos_cierre[t] < len(serie) and serie[pos_cierre[t]].day <= dia:
                ultimo_cierre[t] = serie[pos_cierre[t]].price
                pos_cierre[t] += 1

        # 3. Cuánto valía lo que tenías y cuánto habías pagado por eso.
        tenidas = [t for t, q in cantidad.items() if q > 0]
        valor = sum((cantidad[t] * ultimo_cierre.get(t, precio_compra[t]) for t in tenidas), CERO)
        invertido = sum((costo[t] for t in tenidas), CERO)
        puntos.append(PuntoHistorial(day=dia, value=valor, invested=invertido))
    return puntos

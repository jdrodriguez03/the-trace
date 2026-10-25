# Dueño: Julian · Los cálculos del portafolio. Funciones puras: no tocan la base ni la red.
# Reciben movimientos y precios y devuelven números. Por eso se prueban como cualquier análisis.
from collections import defaultdict
from dataclasses import dataclass, field
from datetime import date
from decimal import Decimal

CERO = Decimal(0)


@dataclass
class Movimiento:
    """Una compra o venta, sin nada de la base (así las pruebas no necesitan base)."""

    ticker: str
    kind: str  # "buy" o "sell"
    quantity: Decimal
    price: Decimal
    day: date
    id: int | None = None


@dataclass
class Precio:
    """El último precio de una acción y su cambio del día en %."""

    price: Decimal
    change_pct: float


@dataclass
class Posicion:
    ticker: str
    name: str
    sector: str
    quantity: Decimal  # cuántas acciones te quedan
    avg_cost: Decimal  # costo promedio por acción
    invested: Decimal  # lo que pagaste por las que te quedan (cantidad × costo promedio)
    price: Decimal
    change_pct: float  # cambio del día de la acción
    value: Decimal  # cantidad × precio de hoy
    gain: Decimal  # ganancia o pérdida en pesos: valor − invertido
    gain_pct: float
    realized_gain: Decimal  # lo que ganaste o perdiste en las ventas
    day_change: Decimal  # cuánto se movió hoy en pesos
    weight_pct: float = 0.0  # qué parte de tu dinero es (se llena al sumar todo)


@dataclass
class Sector:
    sector: str
    value: Decimal
    weight_pct: float


@dataclass
class Resumen:
    total_value: Decimal = CERO
    invested: Decimal = CERO
    gain: Decimal = CERO
    gain_pct: float = 0.0
    realized_gain: Decimal = CERO
    day_change: Decimal = CERO
    day_change_pct: float = 0.0
    top_sector: str | None = None
    top_sector_pct: float = 0.0
    positions: list[Posicion] = field(default_factory=list)
    sectors: list[Sector] = field(default_factory=list)


def _en_orden(movimientos: list[Movimiento]) -> list[Movimiento]:
    """Por fecha; el mismo día, las compras antes que las ventas (igual que al validar ventas)."""
    return sorted(movimientos, key=lambda m: (m.day, m.kind == "sell", m.id or float("inf")))


def _pct(parte: Decimal, total: Decimal) -> float:
    return float(parte / total * 100) if total else 0.0


def cambio_del_dia(valor: Decimal, change_pct: float) -> Decimal:
    """Cuánto subió o bajó hoy en pesos: v − v / (1 + cambio/100).

    Ejemplo: algo que hoy vale $1.010 y subió 1 % ayer valía $1.000, así que subió $10.
    """
    return valor - valor / (1 + Decimal(str(change_pct)) / 100)


def build_positions(
    movimientos: list[Movimiento],
    precios: dict[str, Precio],
    activos: dict[str, tuple[str, str]],  # ticker -> (nombre, sector)
) -> tuple[list[Posicion], Decimal]:
    """Recorre los movimientos en orden y arma cada posición con el método de costo promedio.

    - Comprar: suma cantidad y suma lo pagado. El costo promedio = lo pagado ÷ la cantidad.
    - Vender: no cambia el costo promedio. Ganancia realizada = (precio de venta − promedio) × cantidad.
    Devuelve las posiciones que aún tienen acciones y la ganancia realizada de TODAS las acciones
    (también de las que ya vendiste por completo).
    """
    cantidad: dict[str, Decimal] = defaultdict(Decimal)
    costo: dict[str, Decimal] = defaultdict(Decimal)  # lo pagado por las acciones que quedan
    realizada: dict[str, Decimal] = defaultdict(Decimal)

    for m in _en_orden(movimientos):
        t = m.ticker
        if m.kind == "buy":
            cantidad[t] += m.quantity
            costo[t] += m.quantity * m.price
        else:
            promedio = costo[t] / cantidad[t] if cantidad[t] else CERO
            realizada[t] += (m.price - promedio) * m.quantity
            costo[t] -= promedio * m.quantity
            cantidad[t] -= m.quantity
            if cantidad[t] <= 0:  # vendiste todo: la próxima compra arranca un promedio nuevo
                cantidad[t], costo[t] = CERO, CERO

    posiciones = []
    for t, q in cantidad.items():
        if q <= 0 or t not in precios:
            continue
        p = precios[t]
        nombre, sector = activos.get(t, (t, "Otro"))
        valor = q * p.price
        ganancia = valor - costo[t]
        posiciones.append(Posicion(
            ticker=t, name=nombre, sector=sector, quantity=q, avg_cost=costo[t] / q,
            invested=costo[t], price=p.price, change_pct=p.change_pct, value=valor,
            gain=ganancia, gain_pct=_pct(ganancia, costo[t]), realized_gain=realizada[t],
            day_change=cambio_del_dia(valor, p.change_pct),
        ))
    return posiciones, sum(realizada.values(), CERO)


def calculate_portfolio(
    movimientos: list[Movimiento],
    precios: dict[str, Precio],
    activos: dict[str, tuple[str, str]],
) -> Resumen:
    """Suma todo: valor, lo invertido, ganancia, cambio del día y cuánto pesa cada sector."""
    posiciones, realizada = build_positions(movimientos, precios, activos)
    r = Resumen(realized_gain=realizada)
    if not posiciones:
        return r

    r.total_value = sum((p.value for p in posiciones), CERO)
    r.invested = sum((p.invested for p in posiciones), CERO)
    r.gain = r.total_value - r.invested
    r.gain_pct = _pct(r.gain, r.invested)
    r.day_change = sum((p.day_change for p in posiciones), CERO)
    # El cambio del día en % se mide contra lo que valía ayer, no contra lo de hoy.
    r.day_change_pct = _pct(r.day_change, r.total_value - r.day_change)

    for p in posiciones:
        p.weight_pct = _pct(p.value, r.total_value)
    r.positions = sorted(posiciones, key=lambda p: p.value, reverse=True)

    por_sector: dict[str, Decimal] = defaultdict(Decimal)
    for p in posiciones:
        por_sector[p.sector] += p.value
    r.sectors = [
        Sector(sector=s, value=v, weight_pct=_pct(v, r.total_value))
        for s, v in sorted(por_sector.items(), key=lambda kv: kv[1], reverse=True)
    ]
    r.top_sector, r.top_sector_pct = r.sectors[0].sector, r.sectors[0].weight_pct
    return r

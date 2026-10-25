# Dueño: Julian · Tu portafolio de práctica: compras, ventas y lo que te queda de cada acción.
# El portafolio no se guarda: se calcula sumando tus movimientos (compras menos ventas).
from collections import defaultdict
from decimal import ROUND_DOWN, ROUND_HALF_UP, Decimal

from fastapi import APIRouter, HTTPException
from sqlmodel import select

from app.auth import CurrentUser
from app.clock import hoy
from app.db import SessionDep
from app.models import Asset, PriceSnapshot, Transaction
from app.schemas import HoldingOut, PortfolioOut, TransactionIn, TransactionOut

router = APIRouter(prefix="/v1/portfolio", tags=["portfolio"])

CUATRO = Decimal("0.0001")  # los precios se guardan con 4 decimales
SEIS = Decimal("0.000001")  # las cantidades, con 6


def _movimientos(session, user_id) -> list[Transaction]:
    return list(session.exec(select(Transaction).where(Transaction.user_id == user_id)))


def _signo(m: Transaction) -> Decimal:
    return m.quantity if m.kind == "buy" else -m.quantity


def _acciones_en_negativo(movimientos: list[Transaction]) -> str | None:
    """Repasa los movimientos por fecha. Devuelve la primera acción que quedaría en negativo.

    En un mismo día las compras van antes que las ventas, así el orden en que las escribiste
    ese día no importa. Un movimiento nuevo (sin id) va al final de su grupo.
    """
    orden = sorted(movimientos, key=lambda m: (m.day, m.kind == "sell", m.id or float("inf")))
    saldo: dict[str, Decimal] = defaultdict(Decimal)
    for m in orden:
        saldo[m.ticker] += _signo(m)
        if saldo[m.ticker] < 0:
            return m.ticker
    return None


def _a_salida(t: Transaction) -> TransactionOut:
    return TransactionOut(id=t.id, ticker=t.ticker, kind=t.kind, quantity=t.quantity,
                          price=t.price, day=t.day, created_at=t.created_at)


@router.get("", response_model=PortfolioOut)
def portafolio(user: CurrentUser, session: SessionDep) -> PortfolioOut:
    """Cuántas acciones tienes de cada empresa (compras menos ventas). Las que quedan en 0 no salen."""
    cantidades: dict[str, Decimal] = defaultdict(Decimal)
    for m in _movimientos(session, user.id):
        cantidades[m.ticker] += _signo(m)
    nombres = {a.ticker: a.name for a in session.exec(select(Asset))}
    return PortfolioOut(
        holdings=[
            HoldingOut(ticker=t, name=nombres.get(t, t), quantity=q)
            for t, q in sorted(cantidades.items())
            if q > 0
        ]
    )


@router.get("/transactions", response_model=list[TransactionOut])
def listar(user: CurrentUser, session: SessionDep) -> list[TransactionOut]:
    """Tus movimientos, del más nuevo al más viejo."""
    filas = session.exec(
        select(Transaction)
        .where(Transaction.user_id == user.id)
        .order_by(Transaction.day.desc(), Transaction.id.desc())
    ).all()
    return [_a_salida(t) for t in filas]


@router.post("/transactions", response_model=TransactionOut, status_code=201)
def registrar(body: TransactionIn, user: CurrentUser, session: SessionDep) -> TransactionOut:
    """Registra una compra o una venta de práctica."""
    if session.get(Asset, body.ticker) is None:
        raise HTTPException(status_code=404, detail="Esa acción no existe en The Trace.")

    dia = body.day or hoy()
    if dia > hoy():
        raise HTTPException(status_code=400, detail="La fecha no puede ser futura.")

    precio = body.price
    if precio is None:  # sin precio: el último que tengamos guardado
        precio = session.exec(
            select(PriceSnapshot.price)
            .where(PriceSnapshot.ticker == body.ticker)
            .order_by(PriceSnapshot.day.desc())
            .limit(1)
        ).first()
        if precio is None:
            raise HTTPException(status_code=400, detail="Todavía no hay precio para esa acción.")
    precio = precio.quantize(CUATRO, rounding=ROUND_HALF_UP)

    if body.quantity is not None:
        cantidad = body.quantity.quantize(SEIS, rounding=ROUND_HALF_UP)
    else:  # monto en pesos: se compra lo que alcance, sin pasarse del monto
        cantidad = (body.amount / precio).quantize(SEIS, rounding=ROUND_DOWN)
    if cantidad <= 0:
        raise HTTPException(status_code=400, detail="Esa cantidad es demasiado pequeña.")

    nueva = Transaction(user_id=user.id, ticker=body.ticker, kind=body.kind, quantity=cantidad,
                        price=precio, day=dia)
    if _acciones_en_negativo(_movimientos(session, user.id) + [nueva]):
        raise HTTPException(status_code=400, detail="No tienes tantas acciones para vender.")

    session.add(nueva)
    session.commit()
    session.refresh(nueva)
    return _a_salida(nueva)


@router.delete("/transactions/{transaction_id}", status_code=204)
def borrar(transaction_id: int, user: CurrentUser, session: SessionDep) -> None:
    """Borra un movimiento tuyo para corregir un error."""
    # Si no existe o es de otra persona, la respuesta es la misma: así no se filtra qué ids hay.
    mov = session.get(Transaction, transaction_id)
    if mov is None or mov.user_id != user.id:
        raise HTTPException(status_code=404, detail="Ese movimiento no existe.")

    restantes = [m for m in _movimientos(session, user.id) if m.id != mov.id]
    if _acciones_en_negativo(restantes):
        raise HTTPException(
            status_code=400,
            detail="No puedes borrar esta compra: después vendiste acciones que dependen de ella.",
        )
    session.delete(mov)
    session.commit()

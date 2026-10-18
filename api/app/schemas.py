# Dueño: Julian · El contrato: la forma de lo que entra y sale de cada ruta.
# Un campo nuevo entra como opcional para no romper lo que la web ya usa.
import uuid
from datetime import date, datetime
from decimal import Decimal
from typing import Annotated, Literal

from pydantic import BaseModel, Field, PlainSerializer, field_validator, model_validator


class MeOut(BaseModel):
    id: uuid.UUID
    email: str | None = None
    is_guest: bool


# ---- Mercado (público) ----
# Los pesos salen como número en el JSON (no como texto) para que la web los use directo.
Numero = Annotated[Decimal, PlainSerializer(float, return_type=float, when_used="json")]


class AssetOut(BaseModel):
    ticker: str
    name: str
    sector: str
    price: Numero  # en pesos
    change_pct: float  # cambio del día en %
    updated_at: datetime


class ColcapOut(BaseModel):
    points: Numero
    change_pct: float
    day: date
    updated_at: datetime


# ---- Portafolio (protegido) ----
class TransactionIn(BaseModel):
    """Se manda la cantidad de acciones O el monto en pesos, nunca los dos."""

    ticker: str
    kind: Literal["buy", "sell"]
    quantity: Annotated[Decimal, Field(gt=0, le=1_000_000_000)] | None = None
    amount: Annotated[Decimal, Field(gt=0, le=1_000_000_000_000)] | None = None  # pesos
    price: Annotated[Decimal, Field(gt=0, le=1_000_000_000)] | None = None  # vacío = último precio
    day: date | None = None  # vacío = hoy

    @field_validator("ticker")
    @classmethod
    def _ticker_en_mayusculas(cls, v: str) -> str:
        return v.strip().upper()

    @model_validator(mode="after")
    def _cantidad_o_monto(self):
        if (self.quantity is None) == (self.amount is None):
            raise ValueError("Envía la cantidad de acciones o el monto en pesos, solo uno.")
        return self


class TransactionOut(BaseModel):
    id: int
    ticker: str
    kind: Literal["buy", "sell"]
    quantity: Numero
    price: Numero
    day: date
    created_at: datetime


class HoldingOut(BaseModel):
    ticker: str
    name: str
    quantity: Numero  # compras menos ventas


class PortfolioOut(BaseModel):
    holdings: list[HoldingOut]

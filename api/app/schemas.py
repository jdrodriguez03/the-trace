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
    drivers: str | None = None  # nuevo (día 10): «¿Qué mueve a esta acción?»


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


class PositionOut(BaseModel):
    """Una acción de tu portafolio con su costo promedio y su ganancia o pérdida."""

    ticker: str
    name: str
    sector: str
    quantity: Numero
    avg_cost: Numero  # costo promedio por acción, en pesos
    invested: Numero  # lo que pagaste por las que te quedan
    price: Numero  # precio de hoy
    change_pct: float  # cambio del día de la acción, en %
    value: Numero  # cantidad × precio de hoy
    gain: Numero  # ganancia (+) o pérdida (−) en pesos
    gain_pct: float
    realized_gain: Numero  # ganancia o pérdida de lo que ya vendiste
    day_change: Numero  # cuánto se movió hoy, en pesos
    weight_pct: float  # qué parte de tu dinero es, en %


class SectorOut(BaseModel):
    sector: str
    value: Numero
    weight_pct: float


class PortfolioSummaryOut(BaseModel):
    total_value: Numero
    invested: Numero
    gain: Numero
    gain_pct: float
    realized_gain: Numero
    day_change: Numero
    day_change_pct: float
    top_sector: str | None = None
    top_sector_pct: float
    positions_count: int
    sectors: list[SectorOut]


class PortfolioOut(BaseModel):
    holdings: list[HoldingOut]  # se mantiene para no romper lo que ya usa la web
    positions: list[PositionOut] = []  # nuevo (día 8): de mayor a menor valor
    summary: PortfolioSummaryOut | None = None  # nuevo (día 8)
    updated_at: datetime | None = None  # nuevo (día 12): hora del precio más reciente


# ---- Historial (días 15) ----
Rango = Literal["1m", "3m", "1y"]  # los botones 1M, 3M y 1A


class PricePointOut(BaseModel):
    day: date
    price: Numero  # cierre de ese día (el de hoy se va actualizando)


class PortfolioPointOut(BaseModel):
    day: date
    value: Numero  # lo que valían ese día las acciones que tenías
    invested: Numero  # lo que habías pagado por ellas


# ---- Noticias (protegido) ----
Direccion = Literal["Positivo", "Negativo", "Neutro"]  # en pantalla: buena, mala, neutra
Impacto = Literal["Alta", "Media", "Baja"]  # en pantalla: grande, mediano, pequeño


class NewsOut(BaseModel):
    id: int
    ticker: str
    asset_name: str
    direction: Direccion
    magnitude: Impacto
    title: str
    summary: str  # la explicación corta
    why: str  # «por qué te afecta»
    watch: str  # «qué conviene mirar»
    source: str
    url: str | None = None
    day: date
    weight_pct: float  # «qué parte de tu dinero» está en esa acción (0 si no la tienes)


# ---- Hoy (protegido) ----
class TopAssetOut(BaseModel):
    """La acción que más movió tu portafolio hoy, en pesos."""

    ticker: str
    name: str
    change_pct: float
    effect: Numero  # cuánto movió tu portafolio, en pesos
    weight_pct: float
    cause: str | None = None  # «el precio del petróleo bajó», si hay una noticia que lo explique


class TodayColcapOut(BaseModel):
    points: Numero
    change_pct: float
    line: str  # «Hoy las acciones más grandes del país subieron un poco. …»


class FallbackAssetOut(BaseModel):
    ticker: str
    name: str
    change_pct: float
    text: str  # «33 % de tu dinero · movió tu portafolio unos $40.000 menos. Por qué: …»


class TodayFallbackOut(BaseModel):
    """La explicación de respaldo: lo que se muestra cuando la IA no responde."""

    by_asset: list[FallbackAssetOut]
    vs_colcap: str | None = None
    concentration: str | None = None  # solo si un sector pasa de 40 %
    footer: str


class TodayOut(BaseModel):
    """Todo lo de la pantalla Hoy, ya calculado. Sin portafolio, has_portfolio es False."""

    has_portfolio: bool
    direction: Literal["up", "down", "flat"] | None = None
    change_pct: float | None = None
    change: Numero | None = None  # en pesos
    headline: str | None = None  # «Hoy tu portafolio subió 0,1 %, unos $5.800 más»
    explanation: list[str] = []  # 1 a 3 frases
    top_asset: TopAssetOut | None = None
    colcap: TodayColcapOut | None = None
    fallback: TodayFallbackOut | None = None
    news: list[NewsOut] = []  # las 3 más relevantes para ti
    updated_at: datetime | None = None  # hora del precio más reciente

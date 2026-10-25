# Dueño: Julian · Las tablas de la base. Cada clase con table=True es una tabla en Supabase.
import uuid
from datetime import UTC, date, datetime
from decimal import Decimal

from sqlalchemy import CheckConstraint, DateTime, UniqueConstraint
from sqlmodel import Field, SQLModel


def ahora() -> datetime:
    return datetime.now(UTC)


class User(SQLModel, table=True):
    __tablename__ = "users"

    id: uuid.UUID = Field(primary_key=True)  # el mismo id que entrega Supabase Auth
    email: str | None = Field(default=None, max_length=320)  # vacío si es invitado
    is_guest: bool = Field(default=True)
    created_at: datetime = Field(default_factory=ahora, sa_type=DateTime(timezone=True))


class Asset(SQLModel, table=True):
    __tablename__ = "assets"

    ticker: str = Field(primary_key=True, max_length=20)  # ECOPETROL
    yahoo_symbol: str = Field(unique=True, max_length=30)  # ECOPETROL.CL
    name: str = Field(max_length=100)
    sector: str = Field(max_length=60)


class PriceSnapshot(SQLModel, table=True):
    """Un precio por acción y por día. La fila de hoy se actualiza; las viejas son el historial."""

    __tablename__ = "price_snapshots"
    __table_args__ = (UniqueConstraint("ticker", "day", name="uq_price_ticker_day"),)

    id: int | None = Field(default=None, primary_key=True)
    ticker: str = Field(foreign_key="assets.ticker", index=True, max_length=20)
    day: date
    price: Decimal = Field(max_digits=14, decimal_places=4)  # en pesos
    change_pct: float  # cambio del día en %, por ejemplo -1.4
    source: str = Field(max_length=20)  # "yahoo", "csv" o "catalogo"
    updated_at: datetime = Field(default_factory=ahora, sa_type=DateTime(timezone=True))


class IndexSnapshot(SQLModel, table=True):
    """El COLCAP por día, con la misma idea que PriceSnapshot."""

    __tablename__ = "index_snapshots"
    __table_args__ = (UniqueConstraint("code", "day", name="uq_index_code_day"),)

    id: int | None = Field(default=None, primary_key=True)
    code: str = Field(default="COLCAP", max_length=20)
    day: date
    points: Decimal = Field(max_digits=12, decimal_places=2)
    change_pct: float
    source: str = Field(max_length=20)
    updated_at: datetime = Field(default_factory=ahora, sa_type=DateTime(timezone=True))


class Transaction(SQLModel, table=True):
    """Una compra o venta de práctica. El portafolio se calcula sumando estas filas."""

    __tablename__ = "transactions"
    __table_args__ = (
        CheckConstraint("kind IN ('buy', 'sell')", name="ck_tx_kind"),
        CheckConstraint("quantity > 0", name="ck_tx_quantity_positive"),
        CheckConstraint("price > 0", name="ck_tx_price_positive"),
    )

    id: int | None = Field(default=None, primary_key=True)
    user_id: uuid.UUID = Field(foreign_key="users.id", index=True)
    ticker: str = Field(foreign_key="assets.ticker", max_length=20)
    kind: str = Field(max_length=4)  # "buy" o "sell"
    quantity: Decimal = Field(max_digits=18, decimal_places=6)  # puede ser fraccionaria
    price: Decimal = Field(max_digits=14, decimal_places=4)
    day: date
    created_at: datetime = Field(default_factory=ahora, sa_type=DateTime(timezone=True))


class NewsItem(SQLModel, table=True):
    """Una noticia sobre una acción. Por ahora las cargamos nosotros (semilla o CSV)."""

    __tablename__ = "news_items"
    __table_args__ = (
        CheckConstraint("direction IN ('Positivo', 'Negativo', 'Neutro')", name="ck_news_direction"),
        CheckConstraint("magnitude IN ('Alta', 'Media', 'Baja')", name="ck_news_magnitude"),
    )

    id: int | None = Field(default=None, primary_key=True)
    ticker: str = Field(foreign_key="assets.ticker", index=True, max_length=20)
    direction: str = Field(max_length=10)  # tipo: "Positivo" (buena), "Negativo" (mala), "Neutro"
    magnitude: str = Field(max_length=5)  # impacto: "Alta" (grande), "Media", "Baja" (pequeño)
    title: str = Field(max_length=200)
    summary: str = Field(max_length=500)  # la explicación corta
    why: str = Field(default="", max_length=500)  # «por qué te afecta»
    watch: str = Field(default="", max_length=300)  # «qué conviene mirar»
    cause: str | None = Field(default=None, max_length=200)  # la causa corta que usa Hoy
    source: str = Field(default="Resumen de mercado", max_length=100)
    url: str | None = Field(default=None, max_length=500)
    day: date
    created_at: datetime = Field(default_factory=ahora, sa_type=DateTime(timezone=True))

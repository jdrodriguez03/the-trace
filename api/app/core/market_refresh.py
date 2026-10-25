# Dueño: Julian · Mantiene los precios al día sin tareas programadas.
# Cada vez que alguien abre Mercado, Mi portafolio u Hoy, la ruta llama a refresh_if_stale():
# si el mercado está abierto y el último precio tiene más de 15 minutos, pide precios nuevos.
# Si Yahoo falla, la pantalla sigue con el último precio guardado (y su hora): nunca se rompe.
import logging
from collections.abc import Iterable
from datetime import UTC, datetime, time, timedelta

from sqlalchemy import func
from sqlmodel import Session, delete, select

from app.clock import COLOMBIA
from app.config import get_settings
from app.models import Asset, IndexSnapshot, PriceSnapshot
from app.providers import get_provider
from app.providers.base import Activos, Cotizacion, PriceProvider

logger = logging.getLogger(__name__)

CODIGO_COLCAP = "COLCAP"
ABRE, CIERRA = time(8, 0), time(17, 0)  # horario en que vale la pena pedir precios (Colombia)

# Cuándo fue el último intento, para no reintentar en cada petición si Yahoo está caído.
# Vive en la memoria de la API: se reinicia si Render la reinicia (no pasa nada).
_ultimo_intento: datetime | None = None


def reiniciar_intentos() -> None:
    """Para las pruebas: olvida el último intento."""
    global _ultimo_intento
    _ultimo_intento = None


def _con_zona(momento: datetime) -> datetime:
    """SQLite devuelve horas sin zona; Postgres, con zona. Las dejamos todas en UTC."""
    return momento if momento.tzinfo else momento.replace(tzinfo=UTC)


def mercado_abierto(ahora: datetime) -> bool:
    """De lunes a viernes, entre 8:00 a. m. y 5:00 p. m. de Colombia.

    Los festivos cuentan como abiertos: Yahoo simplemente devuelve el último cierre, sin daño.
    """
    local = _con_zona(ahora).astimezone(COLOMBIA)
    return local.weekday() < 5 and ABRE <= local.time() < CIERRA


def activos_a_pedir(session: Session, simbolo_colcap: str | None = None) -> Activos:
    """{ticker: símbolo de Yahoo} de las 10 acciones, más el COLCAP."""
    from scripts.provisional_catalog import COLCAP  # PROVISIONAL: catálogo de Isabela

    activos = {a.ticker: a.yahoo_symbol for a in session.exec(select(Asset))}
    activos[CODIGO_COLCAP] = simbolo_colcap or COLCAP["yahoo"]
    return activos


def guardar_cotizaciones(session: Session, filas: Iterable[tuple[str, Cotizacion]], fuente: str,
                         ahora: datetime | None = None) -> int:
    """Guarda o actualiza la fila de cada (activo, día): una fila por acción y día.

    Lee de una vez las filas que ya existen (así un año de historial no hace miles de consultas).
    Después borra los precios de ejemplo de esas acciones, porque ya hay precios reales.
    Devuelve cuántas filas guardó.
    """
    ahora = ahora or datetime.now(UTC)
    filas = list(filas)
    if not filas:
        return 0
    tickers = {t for t, _ in filas}
    dias = [c.day for _, c in filas]
    desde, hasta = min(dias), max(dias)

    existentes_p = {(p.ticker, p.day): p for p in session.exec(select(PriceSnapshot).where(
        PriceSnapshot.ticker.in_(tickers), PriceSnapshot.day >= desde, PriceSnapshot.day <= hasta))}
    existentes_i = {i.day: i for i in session.exec(select(IndexSnapshot).where(
        IndexSnapshot.code == CODIGO_COLCAP, IndexSnapshot.day >= desde,
        IndexSnapshot.day <= hasta))} if CODIGO_COLCAP in tickers else {}

    for ticker, c in filas:
        if ticker == CODIGO_COLCAP:
            fila = existentes_i.get(c.day) or IndexSnapshot(
                code=CODIGO_COLCAP, day=c.day, points=c.price, change_pct=c.change_pct,
                source=fuente)
            fila.points = c.price
            existentes_i[c.day] = fila
        else:
            fila = existentes_p.get((ticker, c.day)) or PriceSnapshot(
                ticker=ticker, day=c.day, price=c.price, change_pct=c.change_pct, source=fuente)
            fila.price = c.price
            existentes_p[(ticker, c.day)] = fila
        fila.change_pct, fila.source, fila.updated_at = c.change_pct, fuente, ahora
        session.add(fila)
    borrar_precios_de_ejemplo(session, tickers)
    session.commit()
    return len(filas)


def borrar_precios_de_ejemplo(session: Session, tickers: set[str]) -> None:
    """Quita los precios inventados del catálogo de las acciones que ya tienen precios reales."""
    acciones = tickers - {CODIGO_COLCAP}
    if acciones:
        session.exec(delete(PriceSnapshot).where(PriceSnapshot.ticker.in_(acciones),
                                                 PriceSnapshot.source == "catalogo"))
    if CODIGO_COLCAP in tickers:
        session.exec(delete(IndexSnapshot).where(IndexSnapshot.code == CODIGO_COLCAP,
                                                 IndexSnapshot.source == "catalogo"))


def refresh_if_stale(session: Session, provider: PriceProvider | None = None,
                     ahora: datetime | None = None) -> bool:
    """Pide precios nuevos si hace falta. Devuelve True si los actualizó.

    No hace nada si: la fuente está apagada, el mercado está cerrado, el último precio tiene
    menos de PRICE_REFRESH_MINUTES, o ya se intentó hace poco (aunque haya fallado).
    """
    global _ultimo_intento
    provider = provider or get_provider()
    ahora = ahora or datetime.now(UTC)
    if provider is None or not mercado_abierto(ahora):
        return False

    espera = timedelta(minutes=get_settings().price_refresh_minutes)
    ultimo = session.exec(select(func.max(PriceSnapshot.updated_at))).one()
    if ultimo is not None and ahora - _con_zona(ultimo) < espera:
        return False
    if _ultimo_intento is not None and ahora - _ultimo_intento < espera:
        return False
    _ultimo_intento = ahora

    try:
        cotizaciones = provider.last_prices(activos_a_pedir(session))
    except Exception:  # Yahoo caído, sin internet, formato nuevo…: seguimos con lo guardado
        logger.exception("No se pudieron traer precios de %s; se usa el último guardado",
                         provider.name)
        return False
    if not cotizaciones:
        logger.warning("%s no devolvió ningún precio; se usa el último guardado", provider.name)
        return False
    try:
        guardar_cotizaciones(session, cotizaciones.items(), provider.name, ahora)
    except Exception:
        session.rollback()
        logger.exception("No se pudieron guardar los precios nuevos; se usa el último guardado")
        return False
    logger.info("Precios actualizados desde %s: %d activos", provider.name, len(cotizaciones))
    return True

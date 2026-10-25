# Dueño: Julian · Elige la fuente de precios según la configuración (PRICE_PROVIDER).
from app.config import get_settings
from app.providers.base import PriceProvider


def get_provider() -> PriceProvider | None:
    """La fuente configurada, o None si está apagada ("off", como en las pruebas)."""
    if get_settings().price_provider == "yahoo":
        from app.providers.yahoo import YahooProvider  # solo se carga yfinance si se usa

        return YahooProvider()
    return None

# Dueño: Julian · Precios de la Bolsa de Colombia desde Yahoo Finance (librería yfinance).
# Gratis y sin clave, con unos 15 minutos de retraso. No es un servicio oficial: puede fallar o
# cambiar sin aviso, y sus condiciones no permiten uso comercial. Sirve para el MVP (ver ADR 0003).
import logging
from datetime import date, timedelta
from decimal import Decimal

import pandas as pd
import yfinance as yf

from app.providers.base import Activos, Cierre, Cotizacion, con_cambio

logger = logging.getLogger(__name__)

TIEMPO_MAXIMO = 10  # segundos: si Yahoo no responde, la pantalla sigue con el último precio


def _descargar(simbolos: list[str], **kwargs) -> pd.DataFrame:
    """Una sola descarga para todos los símbolos (más rápido que uno por uno).

    Está aparte para que las pruebas la reemplacen por una tabla falsa y nunca llamen a Yahoo.
    """
    return yf.download(tickers=simbolos, interval="1d", auto_adjust=False, group_by="ticker",
                       progress=False, threads=False, timeout=TIEMPO_MAXIMO, **kwargs)


def _cierres(tabla: pd.DataFrame, simbolo: str) -> list[Cierre]:
    """Saca la columna de cierres de un símbolo, sin días vacíos.

    yfinance devuelve columnas de dos niveles (símbolo, dato) o (dato, símbolo) según la versión;
    se aceptan las dos formas.
    """
    if tabla is None or tabla.empty:
        return []
    columnas = tabla.columns
    if isinstance(columnas, pd.MultiIndex):
        if simbolo in columnas.get_level_values(0):
            serie = tabla[simbolo]["Close"]
        elif simbolo in columnas.get_level_values(1):
            serie = tabla["Close"][simbolo]
        else:
            return []
    else:
        serie = tabla["Close"]
    serie = serie.dropna()
    return [Cierre(day=pd.Timestamp(dia).date(), price=Decimal(str(round(float(valor), 4))))
            for dia, valor in serie.items()]


class YahooProvider:
    name = "yahoo"

    def last_prices(self, activos: Activos) -> dict[str, Cotizacion]:
        # Se piden 10 días para tener siempre el cierre anterior, aunque haya festivos en medio.
        tabla = _descargar(list(activos.values()), period="10d")
        salida = {}
        for ticker, simbolo in activos.items():
            cotizaciones = con_cambio(_cierres(tabla, simbolo))
            if cotizaciones:
                salida[ticker] = cotizaciones[-1]
            else:
                logger.warning("Yahoo no devolvió precio para %s (%s)", ticker, simbolo)
        return salida

    def history(self, activos: Activos, start: date, end: date) -> dict[str, list[Cierre]]:
        # En yfinance `end` no se incluye: se pide un día más.
        tabla = _descargar(list(activos.values()), start=start.isoformat(),
                           end=(end + timedelta(days=1)).isoformat())
        return {ticker: c for ticker, simbolo in activos.items() if (c := _cierres(tabla, simbolo))}

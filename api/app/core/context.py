# Dueño: Julian · El contexto que recibe la IA: el portafolio de la persona, en números simples.
# Traducido de buildPortfolioContext del prototipo, más la ganancia o pérdida de cada acción.
# Regla 8: aquí NUNCA entran el nombre ni el correo. Solo acciones, pesos y porcentajes.
from datetime import UTC, datetime

from app.core.portfolio import Resumen

FRASE_COLCAP = "el índice que resume cómo les va a las acciones más grandes de Colombia"


def _num(valor, decimales: int = 2) -> float:
    return round(float(valor), decimales)


def build_portfolio_context(resumen: Resumen, colcap_change_pct: float | None = None) -> dict:
    """Arma el contexto del portafolio de práctica. Lo arma el servidor, nunca la web."""
    contexto = {
        "fecha": datetime.now(UTC).date().isoformat(),
        "moneda": "COP (pesos colombianos)",
        "tipo_portafolio": "De práctica (sin dinero real)",
        "mercado": "Colombia",
        "valor_estimado_cop": round(resumen.total_value),
        "invertido_cop": round(resumen.invested),
        "ganancia_cop": round(resumen.gain),
        "ganancia_pct": _num(resumen.gain_pct),
        "cambio_hoy_cop": round(resumen.day_change),
        "cambio_hoy_pct": _num(resumen.day_change_pct),
        "acciones": [
            {
                "ticker": p.ticker,
                "nombre": p.name,
                "sector": p.sector,
                "cantidad": _num(p.quantity, 6),
                "precio_cop": _num(p.price),
                "valor_cop": round(p.value),
                "peso_portafolio_pct": _num(p.weight_pct, 1),
                "variacion_hoy_pct": _num(p.change_pct),
                "ganancia_cop": round(p.gain),
                "ganancia_pct": _num(p.gain_pct),
            }
            for p in resumen.positions
        ],
        "sectores": [
            {"sector": s.sector, "valor_cop": round(s.value), "peso_pct": _num(s.weight_pct, 1)}
            for s in resumen.sectors
        ],
    }
    if colcap_change_pct is not None:
        contexto["colcap"] = {"que_es": FRASE_COLCAP, "variacion_pct": _num(colcap_change_pct)}
    return contexto

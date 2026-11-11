# Dueño: Julian · Respuestas de respaldo cuando la IA no está, falla o se acabó la cuota.
# Traducido de localPortfolioInsight y localChatFallback del prototipo. Informan, no recomiendan.
import re
import unicodedata

from app.content.drivers import DRIVER_DEFAULT, DRIVERS
from app.core.formats import cop, parte, pct
from app.core.portfolio import Posicion, Resumen

NO_RECOMIENDA = (
    "The Trace no recomienda comprar, vender ni mantener acciones: explica lo que pasó, "
    "y la decisión es tuya."
)
PIDE_RECOMENDACION = re.compile(
    r"\b(comprar|compro|compre|vender|vendo|venda|mantener|mantengo|debo|deberia|"
    r"recomiend\w*|conviene|invierto|meto)\b"
)


def _sin_tildes(texto: str) -> str:
    base = unicodedata.normalize("NFD", texto.lower())
    return "".join(c for c in base if unicodedata.category(c) != "Mn")


def _accion_mencionada(pregunta: str, resumen: Resumen) -> Posicion | None:
    """La primera acción del portafolio que la pregunta nombra, por ticker o por nombre."""
    for p in resumen.positions:
        nombre = _sin_tildes(p.name).split()[0]
        if _sin_tildes(p.ticker) in pregunta or nombre in pregunta:
            return p
    return None


def _que_la_mueve(p: Posicion) -> str:
    return f"{p.name}: {DRIVERS.get(p.ticker, DRIVER_DEFAULT)}"


def local_portfolio_insight(resumen: Resumen) -> str:
    """Una lectura corta del portafolio, sin IA."""
    if not resumen.positions:
        return "Agrega acciones para ver tu lectura."
    n = len(resumen.positions)
    unidad = "acción" if n == 1 else "acciones"
    frases = [f"Tu portafolio de práctica tiene {n} {unidad} y hoy vale {cop(resumen.total_value)}."]
    mv = resumen.day_change_pct
    if abs(mv) < 0.05:
        frases.append("Hoy casi no cambió.")
    else:
        frases.append(f"Hoy {'subió' if mv > 0 else 'bajó'} {pct(abs(mv), signo=False)}.")
    if resumen.top_sector and resumen.top_sector_pct >= 40:
        frases.append(
            f"Donde más tienes tu dinero es {resumen.top_sector}: {parte(resumen.top_sector_pct)} "
            "del total. Si a ese sector le va mal, tu portafolio lo siente más."
        )
    else:
        frases.append("Tu dinero está repartido entre varios sectores, así que ninguno pesa demasiado.")
    frases.append("En «Noticias que te afectan» ves qué está pasando. Esto explica, no recomienda.")
    return " ".join(frases)


def local_chat_fallback(pregunta: str, resumen: Resumen) -> str:
    """Respuesta del chat sin IA. Si piden una recomendación, explica que no la damos."""
    if not resumen.positions:
        return ("Tu portafolio de práctica está vacío. Agrega una acción y te cuento qué pasó "
                "con ella.")
    q = _sin_tildes(pregunta)
    accion = _accion_mencionada(q, resumen)
    if PIDE_RECOMENDACION.search(q):
        lista = [accion] if accion else resumen.positions[:3]
        que = "esta acción" if accion else "tus acciones"
        detalle = "\n".join(f"• {_que_la_mueve(p)}" for p in lista)
        return f"{NO_RECOMIENDA} Lo que sí te cuento es qué influye en {que}:\n{detalle}"
    if accion:
        c = accion.change_pct
        verbo = "subió" if c > 0 else "bajó" if c < 0 else "no cambió"
        cambio = f" {pct(abs(c), signo=False)}" if c else ""
        return (
            f"{accion.name} {verbo}{cambio} hoy y su precio es {cop(accion.price)}. "
            f"Es {parte(accion.weight_pct).lower()} de tu dinero.\n"
            f"{DRIVERS.get(accion.ticker, DRIVER_DEFAULT)}"
        )
    return local_portfolio_insight(resumen)

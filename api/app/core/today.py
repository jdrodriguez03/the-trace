# Dueño: Julian · La pantalla Hoy, sin IA: qué pasó hoy con tu portafolio y por qué.
# Traducido de todayModel, todayCause, todayHead, todayLead, colcapLine y todayExtended del
# prototipo (docs/prototype/mvp5_parte6_final.html). Funciones puras: no tocan base ni red.
from dataclasses import dataclass
from decimal import ROUND_HALF_UP, Decimal

from app.core.formats import cop, parte
from app.core.portfolio import Posicion, Resumen

CASI_SIN_CAMBIO = 0.05  # un día que se mueve menos de 0,05 % cuenta como «casi no cambió»
ORDEN_IMPACTO = {"Alta": 3, "Media": 2, "Baja": 1}
FRASE_COLCAP = "el termómetro de las acciones más grandes de Colombia"
PIE = "Esto explica lo que pasó. No dice qué va a pasar ni qué hacer."


@dataclass
class Noticia:
    """Lo mínimo de una noticia que Hoy necesita para buscar una causa."""

    id: int
    ticker: str
    direction: str  # "Positivo", "Negativo" o "Neutro"
    magnitude: str  # "Alta", "Media" o "Baja"


@dataclass
class ModeloHoy:
    direction: str  # "up", "down" o "flat"
    pct: float  # cambio del portafolio hoy, en %
    delta: Decimal  # cambio del portafolio hoy, en pesos
    rows: list[Posicion]  # en el orden del portafolio
    ranked: list[Posicion]  # de la que más movió el portafolio (en pesos) a la que menos
    top: Posicion  # la que más pesó hoy
    resumen: Resumen


# ---- Ayudas de texto ----
def _uno(valor: float) -> str:
    """Porcentaje sin signo y con un decimal, como el t4pct del prototipo: -1,44 -> "1,4"."""
    return f"{Decimal(str(abs(valor))).quantize(Decimal('0.1'), ROUND_HALF_UP)}".replace(".", ",")


def monto_aprox(delta: Decimal) -> str:
    """«unos $5.800 más». Redondea a la decena si es poco y a la centena si es más de $1.000.

    Devuelve "" si el movimiento no llega a $1, para que la frase no diga «unos $0 más».
    """
    n = abs(delta)
    if n.quantize(Decimal(1), ROUND_HALF_UP) < 1:
        return ""
    paso = Decimal(10) if n < 1000 else Decimal(100)
    redondo = (n / paso).quantize(Decimal(1), ROUND_HALF_UP) * paso
    return f"unos {cop(redondo)} {'más' if delta > 0 else 'menos'}"


def _verbo(change_pct: float) -> str:
    return "subió" if change_pct > 0 else "bajó"


# ---- El modelo ----
def today_model(resumen: Resumen) -> ModeloHoy | None:
    """Ordena las acciones por cuánto movieron tu portafolio hoy y marca la dirección del día.

    Devuelve None si el portafolio está vacío: Hoy no tiene nada que explicar.
    """
    if not resumen.positions:
        return None
    ranked = sorted(resumen.positions, key=lambda p: abs(p.day_change), reverse=True)
    pct = resumen.day_change_pct
    if abs(pct) < CASI_SIN_CAMBIO:
        direction = "flat"
    else:
        direction = "up" if resumen.day_change > 0 else "down"
    return ModeloHoy(direction=direction, pct=pct, delta=resumen.day_change,
                     rows=list(resumen.positions), ranked=ranked, top=ranked[0], resumen=resumen)


def today_cause(p: Posicion, noticias: list[Noticia], causas: dict[int, str]) -> str | None:
    """La causa de por qué se movió una acción, si hay una noticia que va en su misma dirección.

    Solo usa noticias de esa acción, con causa escrita y del mismo sentido que el movimiento
    (una buena noticia no explica una bajada). Si hay varias, gana la de mayor impacto.
    """
    if not p.change_pct:
        return None
    quiere = "Positivo" if p.change_pct > 0 else "Negativo"
    candidatas = [n for n in noticias
                  if n.ticker == p.ticker and n.direction == quiere and n.id in causas]
    if not candidatas:
        return None
    mejor = max(candidatas, key=lambda n: ORDEN_IMPACTO.get(n.magnitude, 0))  # empate: la primera
    return causas[mejor.id]


def today_head(m: ModeloHoy) -> str:
    """El titular: «Hoy tu portafolio subió 0,1 %, unos $5.800 más»."""
    if m.direction == "flat":
        return "Hoy tu portafolio casi no cambió"
    verbo = "subió" if m.direction == "up" else "bajó"
    monto = monto_aprox(m.delta) or "sin mucho cambio en pesos"
    return f"Hoy tu portafolio {verbo} {_uno(m.pct)} %, {monto}"


def today_lead(m: ModeloHoy, noticias: list[Noticia], causas: dict[int, str]) -> list[str]:
    """La explicación, en 1 a 3 frases: cuál acción pesó más, por qué, cuánto y quién compensó."""
    t = m.top
    if not t.change_pct:
        return ["Ninguna de tus acciones se movió hoy."]

    sube = t.change_pct > 0
    causa = today_cause(t, noticias, causas)
    # ¿La acción que más pesó fue en la misma dirección que el portafolio completo?
    mismo_lado = m.direction != "flat" and (t.day_change > 0) == (m.delta > 0)
    inicio = "La que más se movió fue" if m.direction == "flat" else "La que más pesó fue"

    frases = []
    if causa and mismo_lado:
        frases.append(f"La mayor causa fue {t.name}, porque {causa}.")
    elif causa:
        frases.append(f"{inicio} {t.name}, que {_verbo(t.change_pct)} porque {causa}.")
    else:
        frases.append(f"{inicio} {t.name}, que {_verbo(t.change_pct)} {_uno(t.change_pct)} %. "
                      "Hoy no hay una noticia clara que lo explique.")

    monto = monto_aprox(t.day_change)
    efecto = f", así que su {'subida' if sube else 'bajada'} movió tu portafolio {monto}" if monto else ""
    frases.append(f"Representa {parte(t.weight_pct).replace('Menos', 'menos')} de tu dinero{efecto}.")

    # La primera acción (de las que más movieron) que fue en sentido contrario compensó.
    contraria = next((r for r in m.ranked if r is not t and r.day_change * t.day_change < 0), None)
    if contraria:
        frases.append(f"Del otro lado, {contraria.name} {_verbo(contraria.change_pct)} "
                      f"{_uno(contraria.change_pct)} % y compensó una parte.")
    elif len(m.rows) > 1 and all(r.day_change * t.day_change >= 0 for r in m.rows):
        frases.append("Todas tus acciones se movieron hacia el mismo lado.")
    return frases


def colcap_line(colcap_change_pct: float, m: ModeloHoy | None = None) -> str:
    """Cómo le fue al mercado hoy y, si hay portafolio, si a ti te fue mejor o peor."""
    c, a = colcap_change_pct, abs(colcap_change_pct)
    if a < 0.3:
        como = "casi no se movieron"
    elif a < 1:
        como = "subieron un poco" if c > 0 else "bajaron un poco"
    else:
        como = "subieron bastante" if c > 0 else "bajaron bastante"
    frase = f"Hoy las acciones más grandes del país {como}."
    if m is not None:
        d = m.pct - c
        if abs(d) < 0.3:
            frase += " Tu portafolio se movió parecido."
        else:
            frase += " A tu portafolio le fue mejor." if d > 0 else " A tu portafolio le fue peor."
    return frase


def _movimiento(m: ModeloHoy) -> str:
    if m.direction == "flat":
        return "casi no cambió"
    return f"{'subió' if m.direction == 'up' else 'bajó'} {_uno(m.pct)} %"


def today_extended(m: ModeloHoy, colcap_change_pct: float | None, noticias: list[Noticia],
                   causas: dict[int, str], aproximado: bool = False) -> dict:
    """La explicación de respaldo («Explicación con IA» sin IA): acción por acción, frente al
    COLCAP y, si un sector pasa de 40 %, dónde está tu dinero.

    El prototipo la devolvía como HTML; aquí sale como datos para que la web la pinte.
    aproximado=True cuando el cambio del COLCAP viene del fondo ICOLCAP: dice «cerca de 0,4 %».
    """
    acciones = []
    for r in m.ranked:
        monto = monto_aprox(r.day_change)
        causa = today_cause(r, noticias, causas)
        texto = f"{parte(r.weight_pct)} de tu dinero"
        texto += f" · movió tu portafolio {monto}." if monto else "."
        if causa:
            texto += f" Por qué: {causa}."
        acciones.append({"ticker": r.ticker, "name": r.name, "change_pct": r.change_pct,
                         "text": texto})

    frente_colcap = None  # sin dato del COLCAP no se compara: mejor callar que inventar
    if colcap_change_pct is not None:
        d = m.pct - colcap_change_pct
        if abs(d) < 0.3:
            comparacion = "Se movió parecido al mercado."
        elif d > 0:
            comparacion = "Hoy le fue mejor que al COLCAP."
        else:
            comparacion = "Hoy le fue peor que al COLCAP."
        verbo = "subió" if colcap_change_pct >= 0 else "bajó"
        # Si el dato es del fondo que replica al COLCAP, el % es casi igual pero no exacto.
        cerca = "cerca de " if aproximado else ""
        frente_colcap = (f"El COLCAP, {FRASE_COLCAP}, {verbo} {cerca}{_uno(colcap_change_pct)} %. "
                         f"Tu portafolio {_movimiento(m)}. {comparacion}")

    concentracion = None
    if m.resumen.sectors and m.resumen.top_sector_pct >= 40:
        concentracion = (f"{parte(m.resumen.top_sector_pct)} de tu dinero está en "
                         f"{m.resumen.top_sector}. Por eso lo que le pase a ese sector se nota "
                         "más en tu portafolio.")

    return {"by_asset": acciones, "vs_colcap": frente_colcap, "concentration": concentracion,
            "footer": PIE}

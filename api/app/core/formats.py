# Dueño: Julian · Cómo se escriben las cifras en The Trace: pesos y porcentajes al estilo Colombia.
# Ejemplos: cop(8586000) -> "$8.586.000" · pct(1.4) -> "+1,4 %" · pct(-0.6) -> "−0,6 %"
from decimal import ROUND_HALF_UP, Decimal

MENOS = "−"  # el signo menos tipográfico «−», más legible que el guion «-»


def _redondear(valor: float | Decimal, decimales: int) -> Decimal:
    """Redondea como en el colegio (0,5 sube), no como Python (que redondea al par)."""
    paso = Decimal(1).scaleb(-decimales)  # 0 decimales -> 1, 1 decimal -> 0.1
    return Decimal(str(valor)).quantize(paso, rounding=ROUND_HALF_UP)


def cop(valor: float | Decimal) -> str:
    """Pesos sin decimales y con punto de miles: 8586000 -> "$8.586.000", -40040 -> "−$40.040"."""
    redondo = _redondear(valor, 0)
    miles = f"{abs(redondo):,.0f}".replace(",", ".")
    return f"{MENOS}${miles}" if redondo < 0 else f"${miles}"


def pct(valor: float | Decimal, decimales: int = 1, signo: bool = True) -> str:
    """Porcentaje con coma decimal y espacio antes de %.

    signo=True para cambios ("+1,4 %", "−0,6 %"); signo=False para partes de un total ("32,8 %").
    Un valor que redondeado da cero se escribe sin signo: "0,0 %".
    """
    redondo = _redondear(valor, decimales)
    texto = f"{abs(redondo):.{decimales}f}".replace(".", ",")
    if redondo == 0:
        return f"{texto} %"
    if redondo < 0:
        return f"{MENOS}{texto} %"
    return f"+{texto} %" if signo else f"{texto} %"


def parte(valor: float | Decimal) -> str:
    """«Qué parte de tu dinero», redondeada como en Hoy del prototipo: 32,84 -> "33 %".

    Una parte que no llega a 1 % se escribe "Menos de 1 %", para no mostrar un engañoso "0 %".
    """
    if 0 < valor < 1:
        return "Menos de 1 %"
    return f"{_redondear(valor, 0)} %"

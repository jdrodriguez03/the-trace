# Dueño: Juan Angel (escrito con Julian) · Regla 5: la IA informa, no recomienda.
# Si una respuesta trae una de estas expresiones, se pide otra vez; si vuelve a fallar, respaldo.
import re
import unicodedata

PROHIBIDAS = [
    r"compra(?:r|la|lo|las|los)?\b", r"compre\b", r"vende(?:r|la|lo|las|los)?\b", r"venda\b",
    r"aprovecha", r"deberias", r"te recomiendo", r"recomendamos", r"manten(?:la|lo|las|los)?\b",
    r"es buen momento para", r"no te pierdas", r"invierte en",
]
# «Comprar» o «vender» sí pueden aparecer para explicar que The Trace NO lo dice.
PERMITIDAS = [r"no (?:te )?(?:dice|decimos|recomienda|recomendamos)[^.]*", r"the trace no [^.]*"]

_PROHIBIDAS = re.compile("|".join(PROHIBIDAS))
_PERMITIDAS = re.compile("|".join(PERMITIDAS))


def _normal(texto: str) -> str:
    base = unicodedata.normalize("NFD", texto.lower())
    return "".join(c for c in base if unicodedata.category(c) != "Mn")


def violates_rules(texto: str) -> bool:
    """True si el texto sugiere comprar, vender o mantener."""
    limpio = _PERMITIDAS.sub(" ", _normal(texto))
    return bool(_PROHIBIDAS.search(limpio))

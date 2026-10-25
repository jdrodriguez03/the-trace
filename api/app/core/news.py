# Dueño: Julian · Qué noticias te importan más. Función pura: no toca base ni red.
from dataclasses import dataclass

PUNTOS_IMPACTO = {"Alta": 3, "Media": 2, "Baja": 1}


@dataclass
class NoticiaRankeada:
    news_id: int
    weight_pct: float  # qué parte de tu dinero está en esa acción
    score: float  # impacto × qué parte de tu dinero


def rank_news(noticias: list, pesos: dict[str, float], solo_mias: bool = True) -> list[NoticiaRankeada]:
    """Ordena las noticias por impacto × qué parte de tu dinero está en esa acción.

    Ejemplo con el portafolio de ejemplo: la del petróleo (impacto grande × 32,8 %) va antes que
    la de ISA (grande × 22,9 %), y esta antes que la de Bancolombia (mediano × 26,8 %).
    Con solo_mias=False también salen las de acciones que no tienes (peso 0): van al final,
    ordenadas por impacto. En un empate gana la más reciente.
    `noticias` es cualquier lista de objetos con id, ticker, magnitude y day (como NewsItem).
    """
    filas = []
    for n in noticias:
        peso = pesos.get(n.ticker, 0.0)
        if solo_mias and peso <= 0:
            continue
        puntos = PUNTOS_IMPACTO.get(n.magnitude, 0)
        filas.append((n, NoticiaRankeada(news_id=n.id, weight_pct=peso, score=puntos * peso)))
    filas.sort(key=lambda f: (f[1].score, PUNTOS_IMPACTO.get(f[0].magnitude, 0), f[0].day, f[0].id),
               reverse=True)
    return [r for _, r in filas]

# Dueño: Julian · Noticias que te afectan, ordenadas por cuánto te importan.
from fastapi import APIRouter
from sqlmodel import select

from app.auth import CurrentUser
from app.core.loaders import load_news, load_summary
from app.core.market_refresh import refresh_if_stale
from app.core.news import rank_news
from app.db import SessionDep
from app.models import Asset, NewsItem
from app.schemas import Direccion, Impacto, NewsOut

router = APIRouter(prefix="/v1/news", tags=["news"])


def news_out(n: NewsItem, nombres: dict[str, str], peso: float) -> NewsOut:
    return NewsOut(id=n.id, ticker=n.ticker, asset_name=nombres.get(n.ticker, n.ticker),
                   direction=n.direction, magnitude=n.magnitude, title=n.title, summary=n.summary,
                   why=n.why, watch=n.watch, source=n.source, url=n.url, day=n.day,
                   weight_pct=peso)


def ranked_news_out(session, noticias: list[NewsItem], pesos: dict[str, float],
                    solo_mias: bool = True) -> list[NewsOut]:
    """Las noticias ordenadas por impacto × qué parte de tu dinero, ya listas para la web."""
    por_id = {n.id: n for n in noticias}
    nombres = {a.ticker: a.name for a in session.exec(select(Asset))}
    return [news_out(por_id[r.news_id], nombres, r.weight_pct)
            for r in rank_news(noticias, pesos, solo_mias)]


@router.get("", response_model=list[NewsOut])
def noticias(
    user: CurrentUser,
    session: SessionDep,
    mine: bool = True,
    impact: Impacto | None = None,
    direction: Direccion | None = None,
) -> list[NewsOut]:
    """Noticias de tus acciones (mine=true) o de todas (mine=false), con filtros opcionales.

    - impact: Alta, Media o Baja (grande, mediano, pequeño).
    - direction: Positivo, Negativo o Neutro (buena, mala, neutra).
    """
    refresh_if_stale(session)
    resumen, _ = load_summary(session, user.id)
    pesos = {p.ticker: p.weight_pct for p in resumen.positions}
    filtradas = [n for n in load_news(session)
                 if (impact is None or n.magnitude == impact)
                 and (direction is None or n.direction == direction)]
    return ranked_news_out(session, filtradas, pesos, solo_mias=mine)

# Dueño: Julian · La pantalla Hoy, ya calculada en Python. La web solo la pinta.
from fastapi import APIRouter

from app.auth import CurrentUser
from app.core.loaders import latest_colcap, load_news, load_summary
from app.core.market_refresh import refresh_if_stale
from app.core.today import (
    Noticia,
    colcap_line,
    today_cause,
    today_extended,
    today_head,
    today_lead,
    today_model,
)
from app.db import SessionDep
from app.routes.news import ranked_news_out
from app.schemas import TodayColcapOut, TodayFallbackOut, TodayOut, TopAssetOut

router = APIRouter(prefix="/v1/today", tags=["today"])

NOTICIAS_EN_HOY = 3


@router.get("", response_model=TodayOut)
def hoy(user: CurrentUser, session: SessionDep) -> TodayOut:
    """Qué pasó hoy con tu portafolio y por qué: titular, explicación, COLCAP y noticias."""
    refresh_if_stale(session)
    resumen, actualizado = load_summary(session, user.id)
    noticias_db = load_news(session)
    colcap = latest_colcap(session)
    m = today_model(resumen)

    colcap_out = None
    if colcap is not None:
        colcap_out = TodayColcapOut(points=colcap.points, change_pct=colcap.change_pct,
                                    line=colcap_line(colcap.change_pct, m))

    if m is None:  # sin portafolio: solo el COLCAP, para que la pantalla no quede vacía
        return TodayOut(has_portfolio=False, colcap=colcap_out, updated_at=actualizado)

    # Lo que las funciones de Hoy necesitan de cada noticia, y su causa corta.
    noticias = [Noticia(n.id, n.ticker, n.direction, n.magnitude) for n in noticias_db]
    causas = {n.id: n.cause for n in noticias_db if n.cause}
    pesos = {p.ticker: p.weight_pct for p in resumen.positions}

    t = m.top
    return TodayOut(
        has_portfolio=True,
        direction=m.direction,
        change_pct=m.pct,
        change=m.delta,
        headline=today_head(m),
        explanation=today_lead(m, noticias, causas),
        top_asset=TopAssetOut(ticker=t.ticker, name=t.name, change_pct=t.change_pct,
                              effect=t.day_change, weight_pct=t.weight_pct,
                              cause=today_cause(t, noticias, causas)),
        colcap=colcap_out,
        fallback=TodayFallbackOut(**today_extended(
            m, colcap.change_pct if colcap else None, noticias, causas)),
        news=ranked_news_out(session, noticias_db, pesos)[:NOTICIAS_EN_HOY],
        updated_at=actualizado,
    )

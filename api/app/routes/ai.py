# Dueño: Juan Angel (escrito con Julian) · Trace AI: explicación de Hoy, lectura del portafolio,
# chat y «explicar lo que subrayé». El contexto se arma AQUÍ con las acciones de la persona,
# nunca con lo que mande la web, y nunca lleva nombre ni correo (regla 8).

import json
from typing import Literal

from fastapi import APIRouter, HTTPException
from limits import parse
from limits.storage import MemoryStorage
from limits.strategies import FixedWindowRateLimiter

from app.ai import cache, quota
from app.ai.gemini import IaNoDisponible, generar
from app.ai.guardrails import violates_rules
from app.ai.prompts import instrucciones
from app.auth import CurrentUser
from app.config import get_settings
from app.core.context import build_portfolio_context
from app.core.fallback import NO_RECOMIENDA, local_chat_fallback, local_portfolio_insight
from app.core.loaders import latest_colcap, load_news, load_summary
from app.core.today import Noticia, colcap_line, today_head, today_lead, today_model
from app.db import SessionDep
from app.schemas import AiAnswerOut, AiAskIn

router = APIRouter(prefix="/v1/ai", tags=["ai"])

Tipo = Literal["today", "portfolio", "chat", "explain"]

# Límite propio: 10 preguntas por minuto por persona (además del límite general por IP).
_limite, _contador = parse("10/minute"), FixedWindowRateLimiter(MemoryStorage())


def _datos_de_hoy(session, resumen) -> tuple[dict, str]:
    """Lo que pasó hoy (para el prompt) y la explicación sin IA (respaldo)."""
    m = today_model(resumen)
    colcap = latest_colcap(session)
    noticias_db = load_news(session)
    mias = {p.ticker for p in resumen.positions}
    noticias = [Noticia(n.id, n.ticker, n.direction, n.magnitude) for n in noticias_db]
    causas = {n.id: n.cause for n in noticias_db if n.cause}
    if m is None:
        return {}, local_portfolio_insight(resumen)
    lead = today_lead(m, noticias, causas)
    frases = [today_head(m) + ".", *lead]
    if colcap is not None:
        frases.append(colcap_line(colcap.change_pct, m))
    extra = {
        "resumen_de_hoy": frases,
        "colcap_variacion_pct": round(colcap.change_pct, 2) if colcap else None,
        "noticias": [{"empresa": n.ticker, "tipo": n.direction, "impacto": n.magnitude,
                      "titulo": n.title, "explicacion": n.summary}
                     for n in noticias_db if n.ticker in mias][:6],
    }
    return extra, " ".join(frases)


@router.post("/{tipo}", response_model=AiAnswerOut)
def preguntar(tipo: Tipo, body: AiAskIn, user: CurrentUser, session: SessionDep) -> AiAnswerOut:
    """Responde con Gemini; si no se puede, con el respaldo (que no gasta cuota)."""
    if not _contador.hit(_limite, str(user.id)):
        raise HTTPException(429, {"code": "AI_RATE",
                                  "message": "Vas muy rápido. Espera un minuto y vuelve a preguntar."})
    pregunta = (body.question or "").strip()
    if tipo in ("chat", "explain") and len(pregunta) < 2:
        raise HTTPException(422, "Escribe tu pregunta.")

    resumen, _ = load_summary(session, user.id)
    colcap_hoy = latest_colcap(session)
    contexto = build_portfolio_context(resumen, colcap_hoy.change_pct if colcap_hoy else None)
    extra, respaldo_hoy = _datos_de_hoy(session, resumen)
    if tipo == "today":
        respaldo = respaldo_hoy
    elif tipo == "portfolio":
        respaldo = local_portfolio_insight(resumen)
    else:
        respaldo = local_chat_fallback(pregunta, resumen)

    if not resumen.positions and tipo in ("today", "portfolio"):
        return AiAnswerOut(text=respaldo, source="respaldo",
                           remaining=quota.remaining(session, user.id, tipo))

    tipo_prompt = "chat" if tipo == "explain" else tipo
    reglas = instrucciones(tipo_prompt, contexto, extra if tipo != "portfolio" else None)
    texto_pregunta = pregunta or "Explícame."
    historial = [(h.question, h.answer) for h in body.history] if tipo == "chat" else []
    clave = cache.llave(tipo, get_settings().gemini_model, reglas, texto_pregunta,
                        json.dumps(historial, ensure_ascii=False))
    guardada = cache.leer(session, clave)
    if guardada:
        return AiAnswerOut(text=guardada, source="cache",
                           remaining=quota.remaining(session, user.id, tipo))

    quota.check(session, user.id, tipo)
    try:
        texto = generar(reglas, texto_pregunta, historial)
        if violates_rules(texto):
            texto = generar(reglas + "\n\nRECUERDA: no sugieras comprar, vender ni mantener.",
                            texto_pregunta, historial)
        if violates_rules(texto):
            texto = f"{NO_RECOMIENDA} {respaldo}" if tipo in ("chat", "explain") else respaldo
            return AiAnswerOut(text=texto, source="respaldo",
                               remaining=quota.remaining(session, user.id, tipo))
    except IaNoDisponible:
        return AiAnswerOut(text=respaldo, source="respaldo",
                           remaining=quota.remaining(session, user.id, tipo))

    queda = quota.consume(session, user.id, tipo)
    cache.guardar(session, clave, tipo, texto)
    return AiAnswerOut(text=texto, source="ia", remaining=queda)


def reiniciar_limite() -> None:
    """Para las pruebas."""
    _contador.storage.reset()




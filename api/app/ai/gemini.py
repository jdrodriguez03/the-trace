# Dueño: Juan Angel (escrito con Julian) · El único lugar que habla con Gemini.
# La clave se lee de la configuración del servidor (regla 4): nunca llega a la web.
import logging
from functools import lru_cache

from google import genai
from google.genai import types

from app.config import get_settings

logger = logging.getLogger(__name__)

TIEMPO_MAXIMO_MS = 25_000  # si Gemini tarda más, se responde con el respaldo


def _conversacion(pregunta: str, historial: list[tuple[str, str]]) -> list[types.Content]:
    """Las últimas preguntas y respuestas del chat, y al final la pregunta nueva."""
    turnos = []
    for q, a in historial:
        turnos.append(types.Content(role="user", parts=[types.Part(text=q)]))
        turnos.append(types.Content(role="model", parts=[types.Part(text=a)]))
    turnos.append(types.Content(role="user", parts=[types.Part(text=pregunta)]))
    return turnos


class IaNoDisponible(Exception):
    """No hay clave, no hay modelo o Gemini falló: la ruta responde con el respaldo."""


@lru_cache
def _cliente() -> genai.Client:
    clave = get_settings().gemini_api_key
    if not clave:
        logger.warning("Falta GEMINI_API_KEY: Trace AI responde con el respaldo")
        raise IaNoDisponible("Falta GEMINI_API_KEY")
    return genai.Client(api_key=clave, http_options=types.HttpOptions(timeout=TIEMPO_MAXIMO_MS))


def generar(instrucciones: str, pregunta: str, historial: list[tuple[str, str]] | None = None) -> str:
    """Pide una respuesta corta a Gemini. Razonamiento bajo: rápido y barato para explicar."""
    modelo = get_settings().gemini_model
    if not modelo:
        logger.warning("Falta GEMINI_MODEL: Trace AI responde con el respaldo")
        raise IaNoDisponible("Falta GEMINI_MODEL")
    try:
        r = _cliente().models.generate_content(
            model=modelo,
            contents=_conversacion(pregunta, historial or []),
            config=types.GenerateContentConfig(
                system_instruction=instrucciones,
                thinking_config=types.ThinkingConfig(thinking_level="low"),
                # El razonamiento también gasta de este tope: con poco margen, la respuesta sale vacía.
                max_output_tokens=4096,
            ),
        )
    except IaNoDisponible:
        raise
    except Exception as e:  # red, cuota de Google, modelo inexistente…
        logger.exception("Gemini falló")
        raise IaNoDisponible(str(e)) from e
    texto = (r.text or "").strip()
    if not texto:
        motivo = r.candidates[0].finish_reason if r.candidates else "sin candidatos"
        logger.warning("Gemini respondió vacío (motivo: %s)", motivo)
        raise IaNoDisponible("Gemini respondió vacío")
    return texto

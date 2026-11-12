# Dueño: Juan Angel (escrito con Julian) · El único lugar que habla con Gemini.
# La clave se lee de la configuración del servidor (regla 4): nunca llega a la web.
import logging
from functools import lru_cache

from google import genai
from google.genai import types

from app.config import get_settings

logger = logging.getLogger(__name__)

TIEMPO_MAXIMO_MS = 25_000  # si Gemini tarda más, se responde con el respaldo


class IaNoDisponible(Exception):
    """No hay clave, no hay modelo o Gemini falló: la ruta responde con el respaldo."""


@lru_cache
def _cliente() -> genai.Client:
    clave = get_settings().gemini_api_key
    if not clave:
        raise IaNoDisponible("Falta GEMINI_API_KEY")
    return genai.Client(api_key=clave, http_options=types.HttpOptions(timeout=TIEMPO_MAXIMO_MS))


def generar(instrucciones: str, pregunta: str) -> str:
    """Pide una respuesta corta a Gemini. Razonamiento bajo: rápido y barato para explicar."""
    modelo = get_settings().gemini_model
    if not modelo:
        raise IaNoDisponible("Falta GEMINI_MODEL")
    try:
        r = _cliente().models.generate_content(
            model=modelo,
            contents=pregunta,
            config=types.GenerateContentConfig(
                system_instruction=instrucciones,
                thinking_config=types.ThinkingConfig(thinking_level="low"),
                max_output_tokens=900,
            ),
        )
    except IaNoDisponible:
        raise
    except Exception as e:  # red, cuota de Google, modelo inexistente…
        logger.exception("Gemini falló")
        raise IaNoDisponible(str(e)) from e
    texto = (r.text or "").strip()
    if not texto:
        raise IaNoDisponible("Gemini respondió vacío")
    return texto

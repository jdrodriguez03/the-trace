# Dueño: Juan Angel (escrito con Julian) · Respuestas guardadas 6 horas: misma pregunta con los
# mismos datos = misma respuesta, sin gastar Gemini ni la cuota de la persona.
import hashlib
from datetime import UTC, datetime, timedelta

from sqlmodel import Session

from app.models import AiCache

DURACION = timedelta(hours=6)


def llave(*partes: str) -> str:
    return hashlib.sha256("\x1f".join(partes).encode()).hexdigest()


def leer(session: Session, clave: str) -> str | None:
    fila = session.get(AiCache, clave)
    if fila is None:
        return None
    creada = fila.created_at if fila.created_at.tzinfo else fila.created_at.replace(tzinfo=UTC)
    if datetime.now(UTC) - creada > DURACION:
        return None
    return fila.response


def guardar(session: Session, clave: str, tipo: str, texto: str) -> None:
    fila = session.get(AiCache, clave) or AiCache(key=clave, kind=tipo, response=texto)
    fila.response, fila.created_at = texto, datetime.now(UTC)
    session.add(fila)
    session.commit()

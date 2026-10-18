# Dueño: Julian · Conexión a la base. Las rutas piden una sesión con Depends(get_session).
from collections.abc import Iterator

from sqlalchemy.pool import StaticPool
from sqlmodel import Session, create_engine

from app.config import get_settings


def _make_engine():
    url = get_settings().database_url
    if url.startswith("sqlite"):
        # Solo en las pruebas: una base en memoria compartida por toda la prueba.
        return create_engine(url, connect_args={"check_same_thread": False}, poolclass=StaticPool)
    # Supabase: pool_pre_ping revisa que la conexión siga viva antes de usarla.
    return create_engine(url, pool_pre_ping=True)


engine = _make_engine()


def get_session() -> Iterator[Session]:
    """Abre una sesión por petición y la cierra al terminar, aunque haya un error."""
    with Session(engine) as session:
        yield session

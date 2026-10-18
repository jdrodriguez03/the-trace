# Dueño: Julian · Se carga antes de cualquier prueba.
# Las pruebas NUNCA tocan Supabase: usan una base SQLite en memoria.
import os

os.environ["DATABASE_URL"] = "sqlite://"
os.environ["SUPABASE_URL"] = "https://pruebas.supabase.co"
os.environ["WEB_ORIGIN"] = "https://trace-web-pruebas.onrender.com"


# ---- Ayudas para probar las rutas con sesión ----
import time
import uuid
from types import SimpleNamespace

import jwt
import pytest
from cryptography.hazmat.primitives.asymmetric import ec

_LLAVE = ec.generate_private_key(ec.SECP256R1())  # la "llave de Supabase" de mentira


@pytest.fixture
def api(monkeypatch):
    """Un cliente de la API con la base vacía + las 10 acciones, sin tocar Supabase."""
    from fastapi.testclient import TestClient
    from sqlmodel import Session, SQLModel

    from app import auth, models  # noqa: F401  (registra las tablas)
    from app.db import engine
    from app.main import app
    from scripts.seed_db import seed

    monkeypatch.setattr(
        auth, "get_jwk_client",
        lambda: SimpleNamespace(
            get_signing_key_from_jwt=lambda t: SimpleNamespace(key=_LLAVE.public_key())
        ),
    )
    SQLModel.metadata.drop_all(engine)
    SQLModel.metadata.create_all(engine)
    with Session(engine) as session:
        seed(session)
    yield TestClient(app)
    SQLModel.metadata.drop_all(engine)


def entrar() -> dict[str, str]:
    """Cabeceras de una persona nueva con sesión (cada llamada es una persona distinta)."""
    claims = {"sub": str(uuid.uuid4()), "aud": "authenticated",
              "iss": "https://pruebas.supabase.co/auth/v1", "exp": int(time.time()) + 3600,
              "is_anonymous": True}
    return {"Authorization": f"Bearer {jwt.encode(claims, _LLAVE, algorithm='ES256')}"}


@pytest.fixture(autouse=True)
def _sin_limite_de_peticiones():
    """El límite de 60 por minuto se apaga en las pruebas; solo su propia prueba lo enciende."""
    from app.limits import limiter

    limiter.enabled = False
    yield
    limiter.enabled = False
    limiter.reset()

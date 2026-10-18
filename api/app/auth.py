# Dueño: Julian · Login: verifica el token de Supabase y entrega el usuario de cada petición.
import uuid
from functools import lru_cache
from typing import Annotated

import jwt
from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jwt import PyJWKClient, PyJWKClientConnectionError
from sqlalchemy.exc import IntegrityError

from app.config import get_settings
from app.db import SessionDep
from app.models import User

bearer = HTTPBearer(auto_error=False)

# Supabase firma los tokens con una llave privada (ES256 o RS256). Nosotros solo
# necesitamos su llave pública para comprobar la firma; nunca guardamos un secreto.
ALGORITHMS = ["ES256", "RS256"]


@lru_cache
def get_jwk_client() -> PyJWKClient:
    """Pide las llaves públicas de Supabase y las recuerda unos minutos."""
    base = get_settings().supabase_url.rstrip("/")
    return PyJWKClient(f"{base}/auth/v1/.well-known/jwks.json")


def _no_autorizado(detalle: str) -> HTTPException:
    return HTTPException(401, detalle, headers={"WWW-Authenticate": "Bearer"})


def current_user(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(bearer)],
    session: SessionDep,
) -> User:
    """Devuelve el usuario dueño del token. Sin token válido responde 401."""
    if credentials is None:
        raise _no_autorizado("Falta iniciar sesión.")

    token = credentials.credentials
    issuer = f"{get_settings().supabase_url.rstrip('/')}/auth/v1"
    try:
        clave = get_jwk_client().get_signing_key_from_jwt(token)
        claims = jwt.decode(
            token,
            clave.key,
            algorithms=ALGORITHMS,
            audience="authenticated",
            issuer=issuer,
            options={"require": ["exp", "sub"]},
        )
    except PyJWKClientConnectionError:
        # No es culpa de la persona: no pudimos hablar con Supabase.
        raise HTTPException(503, "No se pudo verificar la sesión. Intenta de nuevo.") from None
    except jwt.PyJWTError:
        raise _no_autorizado("Sesión no válida o vencida.") from None

    try:
        user_id = uuid.UUID(claims["sub"])
    except ValueError:
        raise _no_autorizado("Sesión no válida o vencida.") from None

    email = claims.get("email") or None
    is_guest = bool(claims.get("is_anonymous")) or email is None

    user = session.get(User, user_id)
    if user is None:
        session.add(User(id=user_id, email=email, is_guest=is_guest))
        try:
            session.commit()
        except IntegrityError:
            # Dos peticiones llegaron a la vez y la otra ya creó al usuario.
            session.rollback()
        return session.get(User, user_id)

    if user.email != email or user.is_guest != is_guest:
        # Un invitado que luego entra con correo conserva su id y su portafolio.
        user.email = email
        user.is_guest = is_guest
        session.add(user)
        session.commit()
        session.refresh(user)
    return user


CurrentUser = Annotated[User, Depends(current_user)]

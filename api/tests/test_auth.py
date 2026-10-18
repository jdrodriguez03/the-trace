import time
import uuid
from types import SimpleNamespace

import jwt
import pytest
from cryptography.hazmat.primitives.asymmetric import ec
from fastapi.testclient import TestClient
from jwt import PyJWKClientConnectionError
from sqlmodel import Session, SQLModel, select

from app import auth, models
from app.db import engine
from app.main import app

client = TestClient(app)

ISSUER = "https://pruebas.supabase.co/auth/v1"  # SUPABASE_URL de conftest.py + /auth/v1
LLAVE_SUPABASE = ec.generate_private_key(ec.SECP256R1())  # la "llave de Supabase" de mentira
LLAVE_ATACANTE = ec.generate_private_key(ec.SECP256R1())


class ClienteFalso:
    """Reemplaza la descarga de llaves públicas: entrega siempre la de Supabase."""

    def get_signing_key_from_jwt(self, token):
        return SimpleNamespace(key=LLAVE_SUPABASE.public_key())


@pytest.fixture(autouse=True)
def _sin_red(monkeypatch):
    SQLModel.metadata.create_all(engine)
    monkeypatch.setattr(auth, "get_jwk_client", lambda: ClienteFalso())


def token(sub=None, email=None, anonimo=False, vence_en=3600, aud="authenticated",
          iss=ISSUER, llave=LLAVE_SUPABASE):
    claims = {"sub": sub or str(uuid.uuid4()), "aud": aud, "iss": iss, "role": "authenticated",
              "exp": int(time.time()) + vence_en, "is_anonymous": anonimo}
    if email:
        claims["email"] = email
    return jwt.encode(claims, llave, algorithm="ES256")


def con(t):
    return {"Authorization": f"Bearer {t}"}


def test_sin_token_responde_401():
    r = client.get("/v1/me")
    assert r.status_code == 401
    assert r.headers["www-authenticate"] == "Bearer"


def test_token_basura_responde_401():
    assert client.get("/v1/me", headers=con("esto-no-es-un-token")).status_code == 401


def test_token_vencido_responde_401():
    assert client.get("/v1/me", headers=con(token(vence_en=-10))).status_code == 401


def test_token_de_otra_audiencia_o_emisor_responde_401():
    assert client.get("/v1/me", headers=con(token(aud="otra"))).status_code == 401
    assert client.get("/v1/me", headers=con(token(iss="https://otro.com/auth/v1"))).status_code == 401


def test_token_firmado_con_otra_llave_responde_401():
    assert client.get("/v1/me", headers=con(token(llave=LLAVE_ATACANTE))).status_code == 401


def test_token_sin_sub_responde_401():
    sin_sub = jwt.encode({"aud": "authenticated", "iss": ISSUER, "exp": int(time.time()) + 60},
                         LLAVE_SUPABASE, algorithm="ES256")
    assert client.get("/v1/me", headers=con(sin_sub)).status_code == 401


def test_si_supabase_no_responde_da_503(monkeypatch):
    class Caido:
        def get_signing_key_from_jwt(self, token):
            raise PyJWKClientConnectionError("sin red")

    monkeypatch.setattr(auth, "get_jwk_client", lambda: Caido())
    assert client.get("/v1/me", headers=con(token())).status_code == 503


def test_invitado_entra_y_se_crea_una_sola_vez():
    uid = str(uuid.uuid4())
    for _ in range(2):
        r = client.get("/v1/me", headers=con(token(sub=uid, anonimo=True)))
        assert r.status_code == 200
        assert r.json() == {"id": uid, "email": None, "is_guest": True}
    with Session(engine) as session:
        assert len(session.exec(select(models.User).where(models.User.id == uuid.UUID(uid))).all()) == 1


def test_con_correo_no_es_invitado():
    uid = str(uuid.uuid4())
    r = client.get("/v1/me", headers=con(token(sub=uid, email="ana@correo.com")))
    assert r.json() == {"id": uid, "email": "ana@correo.com", "is_guest": False}


def test_invitado_que_luego_pone_correo_conserva_su_id():
    uid = str(uuid.uuid4())
    client.get("/v1/me", headers=con(token(sub=uid, anonimo=True)))
    r = client.get("/v1/me", headers=con(token(sub=uid, email="ana@correo.com")))
    assert r.json() == {"id": uid, "email": "ana@correo.com", "is_guest": False}

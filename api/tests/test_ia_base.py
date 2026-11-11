# Dueño: Julian · Pruebas de la base de la IA y de Trace+: lista de espera, cuota en /me,
# contexto sin datos personales y respaldo que no recomienda.
import json
import uuid
from datetime import date
from decimal import Decimal

from sqlmodel import Session

from app.core.context import build_portfolio_context
from app.core.fallback import NO_RECOMIENDA, local_chat_fallback, local_portfolio_insight
from app.core.portfolio import Movimiento, Precio, calculate_portfolio
from tests.conftest import entrar

DIA = date(2026, 11, 10)


def resumen_de_ejemplo():
    movimientos = [
        Movimiento("ECOPETROL", "buy", Decimal(1000), Decimal(2000), DIA),
        Movimiento("PFBCOLOM", "buy", Decimal(10), Decimal(35000), DIA),
    ]
    precios = {"ECOPETROL": Precio(Decimal(2100), -1.2), "PFBCOLOM": Precio(Decimal(36000), 0.8)}
    activos = {"ECOPETROL": ("Ecopetrol", "Petróleo y energía"),
               "PFBCOLOM": ("Bancolombia", "Bancos")}
    return calculate_portfolio(movimientos, precios, activos)


# ---- Lista de espera de Trace+ ----

def test_avisame_anota_una_sola_vez(api):
    yo = entrar()
    primera = api.post("/v1/waitlist/trace-plus", headers=yo)
    segunda = api.post("/v1/waitlist/trace-plus", headers=yo)
    assert primera.status_code == 200
    assert primera.json() == {"plan": "trace_plus", "already": False}
    assert segunda.json() == {"plan": "trace_plus", "already": True}


def test_avisame_sin_sesion_responde_401(api):
    assert api.post("/v1/waitlist/trace-plus").status_code == 401


# ---- Cuota en /me ----

def test_me_trae_la_cuota_en_cero_para_alguien_nuevo(api):
    datos = api.get("/v1/me", headers=entrar()).json()
    assert datos["ai_quota"]["limit"] == 5
    assert datos["ai_quota"]["used"] == {"today": 0, "portfolio": 0, "chat": 0, "explain": 0}


def test_me_cuenta_los_usos_de_hoy(api):
    from app.clock import hoy
    from app.db import engine
    from app.models import AiUsage

    yo = entrar()
    user_id = uuid.UUID(api.get("/v1/me", headers=yo).json()["id"])
    with Session(engine) as s:
        s.add(AiUsage(user_id=user_id, day=hoy(), kind="chat", count=3))
        s.add(AiUsage(user_id=user_id, day=date(2020, 1, 1), kind="chat", count=5))  # otro día
        s.commit()
    assert api.get("/v1/me", headers=yo).json()["ai_quota"]["used"]["chat"] == 3


# ---- Contexto para la IA ----

def test_el_contexto_no_lleva_nombre_ni_correo():
    texto = json.dumps(build_portfolio_context(resumen_de_ejemplo(), 0.4), ensure_ascii=False)
    for prohibido in ("@", "email", "correo", "nombre_usuario", "user_id"):
        assert prohibido not in texto


def test_el_contexto_trae_la_ganancia_de_cada_accion():
    ctx = build_portfolio_context(resumen_de_ejemplo())
    eco = next(a for a in ctx["acciones"] if a["ticker"] == "ECOPETROL")
    assert eco["ganancia_cop"] == 100_000  # 1000 × (2100 − 2000)
    assert ctx["valor_estimado_cop"] == 2_460_000
    assert "colcap" not in ctx  # sin dato del COLCAP no se inventa


# ---- Respaldo sin IA ----

def test_debo_vender_ecopetrol_no_recomienda():
    respuesta = local_chat_fallback("¿Debo vender Ecopetrol?", resumen_de_ejemplo())
    assert respuesta.startswith(NO_RECOMIENDA)
    assert "Ecopetrol" in respuesta


def test_pregunta_por_una_accion_cuenta_que_paso():
    respuesta = local_chat_fallback("¿qué pasó con bancolombia?", resumen_de_ejemplo())
    assert respuesta.startswith("Bancolombia subió 0,8 % hoy")
    assert "$36.000" in respuesta


def test_lectura_local_usa_pesos_y_no_recomienda():
    lectura = local_portfolio_insight(resumen_de_ejemplo())
    assert "$2.460.000" in lectura
    assert "no recomienda" in lectura

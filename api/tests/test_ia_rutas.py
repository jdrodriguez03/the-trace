# Pruebas de Trace AI con un Gemini de mentira: nunca se llama a Google.
import pytest

from app.ai.guardrails import violates_rules
from app.routes import ai as rutas_ia
from tests.conftest import entrar

T = "/v1/portfolio/transactions"


@pytest.fixture
def gemini(monkeypatch):
    """Reemplaza a Gemini. `respuestas` es la cola de lo que va a contestar."""
    estado = {"respuestas": [], "llamadas": [], "falla": False}

    def falso(reglas, pregunta):
        estado["llamadas"].append((reglas, pregunta))
        if estado["falla"]:
            raise rutas_ia.IaNoDisponible("sin red")
        return estado["respuestas"].pop(0) if estado["respuestas"] else "Ecopetrol bajó hoy."

    monkeypatch.setattr(rutas_ia, "generar", falso)
    rutas_ia.reiniciar_limite()
    return estado


def con_portafolio(api):
    yo = entrar()
    api.post(T, headers=yo, json={"ticker": "ECOPETROL", "kind": "buy", "amount": 1_000_000})
    return yo


def test_chat_responde_con_ia_y_descuenta(api, gemini):
    yo = con_portafolio(api)
    r = api.post("/v1/ai/chat", headers=yo, json={"question": "¿Qué pasó con Ecopetrol?"})
    assert r.status_code == 200
    assert r.json() == {"text": "Ecopetrol bajó hoy.", "source": "ia", "remaining": 4}


def test_el_contexto_va_sin_correo(api, gemini):
    yo = con_portafolio(api)
    api.post("/v1/ai/today", headers=yo, json={})
    reglas, _ = gemini["llamadas"][0]
    assert "ECOPETROL" in reglas and "@" not in reglas


def test_misma_pregunta_sale_de_la_cache_sin_gastar(api, gemini):
    yo = con_portafolio(api)
    api.post("/v1/ai/chat", headers=yo, json={"question": "¿Qué es el COLCAP?"})
    r = api.post("/v1/ai/chat", headers=yo, json={"question": "¿Qué es el COLCAP?"})
    assert r.json()["source"] == "cache" and r.json()["remaining"] == 4
    assert len(gemini["llamadas"]) == 1


def test_al_pasar_5_usos_responde_429_ai_quota(api, gemini):
    yo = con_portafolio(api)
    for i in range(5):
        assert api.post("/v1/ai/chat", headers=yo, json={"question": f"Pregunta {i}"}).status_code == 200
    r = api.post("/v1/ai/chat", headers=yo, json={"question": "Una más"})
    assert r.status_code == 429 and r.json()["detail"]["code"] == "AI_QUOTA"


def test_explicar_subrayado_comparte_cuota_con_el_chat(api, gemini):
    yo = con_portafolio(api)
    api.post("/v1/ai/explain", headers=yo, json={"question": "Explícame «dividendo»"})
    assert api.get("/v1/me", headers=yo).json()["ai_quota"]["used"]["chat"] == 1


def test_si_gemini_recomienda_dos_veces_sale_el_respaldo(api, gemini):
    yo = con_portafolio(api)
    gemini["respuestas"] = ["Deberías comprar Ecopetrol.", "Te recomiendo vender."]
    r = api.post("/v1/ai/chat", headers=yo, json={"question": "¿Debo vender Ecopetrol?"}).json()
    assert r["source"] == "respaldo" and r["text"].startswith("The Trace no recomienda")
    assert r["remaining"] == 5  # el respaldo no gasta cuota


def test_si_gemini_falla_sale_el_respaldo(api, gemini):
    yo = con_portafolio(api)
    gemini["falla"] = True
    r = api.post("/v1/ai/portfolio", headers=yo, json={}).json()
    assert r["source"] == "respaldo" and "no recomienda" in r["text"]


def test_sin_sesion_401_y_chat_sin_pregunta_422(api, gemini):
    assert api.post("/v1/ai/chat", json={"question": "hola"}).status_code == 401
    assert api.post("/v1/ai/chat", headers=entrar(), json={}).status_code == 422


def test_mas_de_10_por_minuto_responde_429(api, gemini):
    yo = con_portafolio(api)
    codigos = [api.post("/v1/ai/portfolio", headers=yo, json={}).status_code for _ in range(11)]
    assert codigos[-1] == 429


@pytest.mark.parametrize("texto,malo", [
    ("Deberías comprar más acciones.", True),
    ("Te recomiendo mantenerla.", True),
    ("Aprovecha que bajó.", True),
    ("The Trace no recomienda comprar ni vender: explica lo que pasó.", False),
    ("Ecopetrol bajó 1,4 % porque el petróleo bajó.", False),
])
def test_filtro_de_recomendaciones(texto, malo):
    assert violates_rules(texto) is malo

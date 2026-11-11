from app.limits import limiter

WEB = "https://trace-web-pruebas.onrender.com"  # WEB_ORIGIN de conftest.py
LOCAL = "http://localhost:5173"


def preflight(api, origen):
    return api.options(
        "/v1/portfolio/transactions",
        headers={"Origin": origen, "Access-Control-Request-Method": "POST",
                 "Access-Control-Request-Headers": "authorization,content-type"},
    )


# ---- CORS ----
def test_la_web_y_el_entorno_local_pueden_llamar(api):
    for origen in (WEB, LOCAL):
        r = preflight(api, origen)
        assert r.status_code == 200
        assert r.headers["access-control-allow-origin"] == origen


def test_otro_sitio_no_puede_llamar(api):
    r = preflight(api, "https://sitio-malo.com")
    assert r.status_code == 400
    assert "access-control-allow-origin" not in r.headers


def test_las_respuestas_normales_llevan_la_cabecera_cors(api):
    r = api.get("/v1/market/colcap", headers={"Origin": WEB})
    assert r.headers["access-control-allow-origin"] == WEB


# ---- Límite de peticiones ----
def test_la_peticion_241_en_un_minuto_responde_429(api):
    limiter.enabled = True
    limiter.reset()
    for _ in range(240):
        assert api.get("/v1/market/colcap").status_code == 200

    r = api.get("/v1/market/colcap", headers={"Origin": WEB})
    assert r.status_code == 429
    assert r.json() == {"detail": "Demasiadas peticiones. Espera un momento e inténtalo de nuevo."}
    assert r.headers["retry-after"] == "60"
    assert r.headers["access-control-allow-origin"] == WEB  # el navegador sí puede leer el 429


def test_el_limite_es_por_ip_y_health_no_cuenta(api):
    limiter.enabled = True
    limiter.reset()
    for _ in range(241):
        api.get("/v1/market/colcap", headers={"X-Forwarded-For": "1.1.1.1"})
    assert api.get("/v1/market/colcap", headers={"X-Forwarded-For": "1.1.1.1"}).status_code == 429

    # otra persona, desde otra IP, no se ve afectada
    assert api.get("/v1/market/colcap", headers={"X-Forwarded-For": "2.2.2.2"}).status_code == 200
    # y /health responde siempre, aunque esa IP ya se pasó
    assert api.get("/health", headers={"X-Forwarded-For": "1.1.1.1"}).status_code == 200

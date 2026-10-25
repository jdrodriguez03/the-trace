from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_health_responde_ok_y_llega_a_la_base():
    respuesta = client.get("/health")
    assert respuesta.status_code == 200
    assert respuesta.json() == {"status": "ok", "db": "ok"}

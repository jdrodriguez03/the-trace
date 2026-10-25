from datetime import timedelta

from app.clock import hoy
from tests.conftest import entrar

T = "/v1/portfolio/transactions"


def comprar(api, h, ticker="ECOPETROL", cantidad=10, **extra):
    return api.post(T, headers=h, json={"ticker": ticker, "kind": "buy", "quantity": cantidad,
                                        **extra})


def vender(api, h, ticker="ECOPETROL", cantidad=1, **extra):
    return api.post(T, headers=h, json={"ticker": ticker, "kind": "sell", "quantity": cantidad,
                                        **extra})


def tiene(api, h) -> dict[str, float]:
    return {x["ticker"]: x["quantity"] for x in api.get("/v1/portfolio", headers=h).json()["holdings"]}


# ---- Sesión obligatoria ----
def test_todas_las_rutas_protegidas_piden_sesion(api):
    cuerpo = {"ticker": "ECOPETROL", "kind": "buy", "quantity": 1}
    assert api.get("/v1/portfolio").status_code == 401
    assert api.get(T).status_code == 401
    assert api.post(T, json=cuerpo).status_code == 401
    assert api.delete(f"{T}/1").status_code == 401


# ---- Comprar ----
def test_comprar_sin_precio_ni_fecha_usa_el_ultimo_precio_y_hoy(api):
    h = entrar()
    r = comprar(api, h, cantidad=10)
    assert r.status_code == 201
    m = r.json()
    assert m["price"] == 2350 and m["day"] == hoy().isoformat() and m["quantity"] == 10
    assert tiene(api, h) == {"ECOPETROL": 10}


def test_comprar_por_monto_en_pesos(api):
    h = entrar()
    r = api.post(T, headers=h, json={"ticker": "ecopetrol", "kind": "buy", "amount": 23500})
    assert r.status_code == 201
    assert r.json()["quantity"] == 10 and r.json()["ticker"] == "ECOPETROL"
    # 10.000 pesos no alcanzan para una acción entera: se compra la parte que alcance
    r = api.post(T, headers=h, json={"ticker": "ECOPETROL", "kind": "buy", "amount": 10000})
    assert r.json()["quantity"] == 4.255319  # 10.000 / 2.350, sin pasarse del monto


def test_con_precio_y_fecha_propios(api):
    h = entrar()
    ayer = (hoy() - timedelta(days=3)).isoformat()
    r = comprar(api, h, cantidad=5, price=2000, day=ayer)
    assert r.status_code == 201 and r.json()["price"] == 2000 and r.json()["day"] == ayer


def test_envia_cantidad_o_monto_pero_no_ambos_ni_ninguno(api):
    h = entrar()
    base = {"ticker": "ECOPETROL", "kind": "buy"}
    assert api.post(T, headers=h, json=base).status_code == 422
    assert api.post(T, headers=h, json={**base, "quantity": 1, "amount": 1000}).status_code == 422


def test_datos_invalidos_responden_422(api):
    h = entrar()
    assert comprar(api, h, cantidad=0).status_code == 422
    assert comprar(api, h, cantidad=-3).status_code == 422
    assert comprar(api, h, cantidad=1, price=0).status_code == 422
    assert api.post(T, headers=h, json={"ticker": "ECOPETROL", "kind": "regalo",
                                        "quantity": 1}).status_code == 422


def test_accion_que_no_existe_responde_404(api):
    assert comprar(api, entrar(), ticker="NOEXISTE").status_code == 404


def test_fecha_futura_responde_400(api):
    manana = (hoy() + timedelta(days=1)).isoformat()
    assert comprar(api, entrar(), day=manana).status_code == 400


# ---- Vender ----
def test_vender_mas_de_lo_que_hay_responde_400(api):
    h = entrar()
    assert vender(api, h, cantidad=1).status_code == 400  # no tiene nada
    comprar(api, h, cantidad=10)
    assert vender(api, h, cantidad=11).status_code == 400
    assert tiene(api, h) == {"ECOPETROL": 10}  # lo rechazado no se guarda


def test_vender_una_parte_y_todo(api):
    h = entrar()
    comprar(api, h, cantidad=10)
    assert vender(api, h, cantidad=4).status_code == 201
    assert tiene(api, h) == {"ECOPETROL": 6}
    assert vender(api, h, cantidad=6).status_code == 201
    assert tiene(api, h) == {}  # lo que queda en 0 no aparece


def test_no_se_puede_vender_antes_de_haber_comprado(api):
    h = entrar()
    comprar(api, h, cantidad=10)  # compra de hoy
    ayer = (hoy() - timedelta(days=1)).isoformat()
    assert vender(api, h, cantidad=5, day=ayer).status_code == 400  # ayer aún no tenía nada


def test_compra_y_venta_el_mismo_dia_en_cualquier_orden(api):
    h = entrar()
    assert comprar(api, h, cantidad=10).status_code == 201
    assert vender(api, h, cantidad=10).status_code == 201
    assert comprar(api, h, cantidad=3).status_code == 201


# ---- Portafolio ----
def test_el_portafolio_es_compras_menos_ventas_por_accion(api):
    h = entrar()
    comprar(api, h, "ECOPETROL", 10)
    comprar(api, h, "ECOPETROL", 5)
    vender(api, h, "ECOPETROL", 3)
    comprar(api, h, "ISA", 2.5)
    p = api.get("/v1/portfolio", headers=h).json()["holdings"]
    assert p == [{"ticker": "ECOPETROL", "name": p[0]["name"], "quantity": 12},
                 {"ticker": "ISA", "name": p[1]["name"], "quantity": 2.5}]


def test_movimientos_salen_del_mas_nuevo_al_mas_viejo(api):
    h = entrar()
    comprar(api, h, cantidad=1, day=(hoy() - timedelta(days=5)).isoformat())
    comprar(api, h, cantidad=2)
    dias = [m["day"] for m in api.get(T, headers=h).json()]
    assert dias == sorted(dias, reverse=True) and len(dias) == 2


# ---- Borrar ----
def test_borrar_un_movimiento_corrige_el_portafolio(api):
    h = entrar()
    mid = comprar(api, h, cantidad=10).json()["id"]
    assert api.delete(f"{T}/{mid}", headers=h).status_code == 204
    assert tiene(api, h) == {} and api.get(T, headers=h).json() == []


def test_no_se_puede_borrar_una_compra_de_la_que_depende_una_venta(api):
    h = entrar()
    compra = comprar(api, h, cantidad=10).json()["id"]
    venta = vender(api, h, cantidad=10).json()["id"]
    assert api.delete(f"{T}/{compra}", headers=h).status_code == 400
    assert api.delete(f"{T}/{venta}", headers=h).status_code == 204  # la venta sí
    assert api.delete(f"{T}/{compra}", headers=h).status_code == 204  # y ahora la compra


def test_borrar_algo_que_no_existe_responde_404(api):
    assert api.delete(f"{T}/9999", headers=entrar()).status_code == 404


# ---- Cada persona solo ve lo suyo ----
def test_el_usuario_b_no_ve_ni_borra_lo_del_usuario_a(api):
    a, b = entrar(), entrar()
    mid = comprar(api, a, cantidad=10).json()["id"]

    assert api.get(T, headers=b).json() == []
    vacio = api.get("/v1/portfolio", headers=b).json()
    assert vacio["holdings"] == [] and vacio["positions"] == []
    assert vacio["summary"]["total_value"] == 0
    assert api.delete(f"{T}/{mid}", headers=b).status_code == 404  # igual que si no existiera
    assert tiene(api, a) == {"ECOPETROL": 10}  # lo de A sigue intacto

    # B tampoco puede vender lo que tiene A
    assert vender(api, b, cantidad=1).status_code == 400

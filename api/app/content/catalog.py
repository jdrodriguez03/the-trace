"""Catálogo de las 10 acciones del MVP y el COLCAP de ejemplo.

Dueña: Isabela. Datos del prototipo. Tiene la misma forma que
`scripts/provisional_catalog.py` de Julian, para que él solo cambie el import.

Los precios y cambios son de ejemplo: las pruebas los usan como precios fijos.
Los precios reales llegan de Yahoo Finance (`app/providers/yahoo.py`).
"""

ASSETS = [
    # ticker, símbolo de Yahoo, nombre, sector, precio de ejemplo en pesos, cambio del día en %
    {"ticker": "MINEROS", "yahoo": "MINEROS.CL", "name": "Mineros", "sector": "Minería",
     "price": 8900, "change": 2.8},
    {"ticker": "CELSIA", "yahoo": "CELSIA.CL", "name": "Celsia", "sector": "Energía eléctrica",
     "price": 4100, "change": 2.6},
    {"ticker": "ISA", "yahoo": "ISA.CL", "name": "ISA", "sector": "Energía eléctrica",
     "price": 21800, "change": 1.9},
    {"ticker": "GEB", "yahoo": "GEB.CL", "name": "Grupo Energía Bogotá",
     "sector": "Energía eléctrica", "price": 2700, "change": 1.2},
    # Bancolombia cotiza en Yahoo como Grupo Cibest (verificado por Julian el 25 oct 2026).
    {"ticker": "PFBCOLOM", "yahoo": "PFCIBEST.CL", "name": "Bancolombia (Grupo Cibest)",
     "sector": "Bancos", "price": 38400, "change": 0.8},
    {"ticker": "GRUPOARGOS", "yahoo": "GRUPOARGOS.CL", "name": "Grupo Argos",
     "sector": "Seguros e inversiones", "price": 16900, "change": 0.3},
    {"ticker": "GRUPOSURA", "yahoo": "GRUPOSURA.CL", "name": "Grupo Sura",
     "sector": "Seguros e inversiones", "price": 37500, "change": -0.6},
    {"ticker": "PFDAVVNDA", "yahoo": "PFDAVVNDA.CL", "name": "Davivienda", "sector": "Bancos",
     "price": 22600, "change": -0.9},
    {"ticker": "ECOPETROL", "yahoo": "ECOPETROL.CL", "name": "Ecopetrol",
     "sector": "Petróleo y energía", "price": 2350, "change": -1.4},
    {"ticker": "CEMARGOS", "yahoo": "CEMARGOS.CL", "name": "Cementos Argos",
     "sector": "Construcción", "price": 9800, "change": -2.1},
]

# Yahoo no tiene el índice COLCAP. Se usa el fondo iShares COLCAP (ICOLCAP.CL), que lo replica:
# su cambio del día es casi igual, pero su precio no son los puntos del índice.
COLCAP = {"code": "COLCAP", "yahoo": "ICOLCAP.CL", "points": "1812.40", "change": 0.6}

# Portafolio de ejemplo: con los precios de arriba vale $8.586.000.
EXAMPLE_PORTFOLIO = [("ECOPETROL", 1200), ("PFBCOLOM", 60), ("ISA", 90), ("GRUPOSURA", 40)]

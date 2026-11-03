"""«¿Qué mueve a esta acción?» de las 10 acciones (sensitivityFor del prototipo).

Dueña: Isabela. Misma forma que `DRIVERS` y `DRIVER_DEFAULT` en
`scripts/provisional_content.py`. Llega a la web dentro de `GET /v1/market/assets`.
"""

DRIVERS = {
    "ECOPETROL": "La mueven el precio del petróleo, el dólar y cuánto petróleo produce. Si el "
                 "dólar sube, su petróleo vale más en pesos.",
    "PFBCOLOM": "Le importan lo que cuesta pedir prestado, cuánta gente pide préstamos y si los "
                "clientes pagan a tiempo.",
    "ISA": "Dependen de sus contratos de líneas de energía, del dólar y de las reglas del "
           "gobierno. Como los contratos duran años, sus ingresos son estables.",
    "GRUPOSURA": "Le afectan los seguros que ofrece y cómo les va a las empresas donde invierte. "
                 "También pesa lo que cuesta pedir prestado.",
    "GRUPOARGOS": "Depende de cómo les vaya a las empresas de las que es dueño, como las de "
                  "cemento y energía.",
    "CEMARGOS": "Se mueve con la construcción de casas y obras, el precio de los materiales y el "
                "dólar. Cuando se construye menos, recibe menos pedidos.",
    "GEB": "Le importan sus contratos de transporte de energía y gas, las reglas del gobierno y "
           "el dólar. Casi todo su ingreso viene de contratos largos.",
    "CELSIA": "La mueven las lluvias: con más agua produce más energía y más barata. También "
              "pesa el precio de la energía.",
    "PFDAVVNDA": "Le afectan lo que cuesta pedir prestado, cuánta gente pide préstamos y si los "
                 "clientes pagan. Una economía débil le complica el cobro.",
    "MINEROS": "Depende del precio del oro, del dólar y de cuánto oro logra sacar. Si el oro "
               "sube, cada gramo que produce vale más.",
}

DRIVER_DEFAULT = "Le afectan la economía del país, su sector y las decisiones de la empresa."

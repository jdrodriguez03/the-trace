# Dueño: Julian · PROVISIONAL: cambiar por api/app/content/news_seed.py y causes.py de Isabela.
# Copiado de NEWS_DATABASE y TODAY_CAUSE del prototipo (mvp5_parte6_final.html).

NEWS = [
    # id, ticker, dirección, impacto, título, explicación corta
    {"id": 1, "ticker": "ECOPETROL", "direction": "Negativo", "magnitude": "Alta",
     "title": "El petróleo baja de precio y Ecopetrol lo siente",
     "summary": "El precio del petróleo es clave para Ecopetrol. Si baja, la empresa recibe "
                "menos por cada barril."},
    {"id": 2, "ticker": "ECOPETROL", "direction": "Positivo", "magnitude": "Baja",
     "title": "Ecopetrol produce un poco más de petróleo este mes",
     "summary": "Producir más significa tener más petróleo disponible. El efecto es pequeño por "
                "ahora."},
    {"id": 3, "ticker": "PFBCOLOM", "direction": "Positivo", "magnitude": "Media",
     "title": "Bancolombia gana más por los préstamos que entrega",
     "summary": "Cuando más personas piden préstamos y los pagan a tiempo, el banco gana más."},
    {"id": 4, "ticker": "PFDAVVNDA", "direction": "Negativo", "magnitude": "Media",
     "title": "Más clientes de Davivienda se atrasan en sus pagos",
     "summary": "Si los clientes no pagan a tiempo, el banco debe guardar plata para cubrir esas "
                "pérdidas."},
    {"id": 5, "ticker": "ISA", "direction": "Positivo", "magnitude": "Alta",
     "title": "ISA gana un contrato para nuevas líneas de energía",
     "summary": "Construir y operar líneas eléctricas le asegura ingresos durante muchos años."},
    {"id": 6, "ticker": "GEB", "direction": "Neutro", "magnitude": "Baja",
     "title": "El Grupo Energía Bogotá sigue con sus planes de obras",
     "summary": "La empresa dijo que sus proyectos avanzan como estaban previstos. No hay cambios "
                "por ahora."},
    {"id": 7, "ticker": "CELSIA", "direction": "Positivo", "magnitude": "Media",
     "title": "Celsia genera más energía gracias a las lluvias",
     "summary": "Con más agua en los embalses, sus plantas producen más energía y a menor costo."},
    {"id": 8, "ticker": "GRUPOSURA", "direction": "Neutro", "magnitude": "Media",
     "title": "Grupo Sura presenta resultados parecidos a los del año pasado",
     "summary": "Sus seguros y sus inversiones dejaron ganancias similares. No hubo sorpresas."},
    {"id": 9, "ticker": "GRUPOARGOS", "direction": "Negativo", "magnitude": "Baja",
     "title": "A una de las empresas de Grupo Argos le va un poco peor",
     "summary": "Grupo Argos es dueño de partes de otras empresas. Si a ellas les va peor, a él "
                "también."},
    {"id": 10, "ticker": "CEMARGOS", "direction": "Negativo", "magnitude": "Alta",
     "title": "Baja la demanda de cemento por menos obras",
     "summary": "Cementos Argos recibe menos pedidos cuando se levantan menos casas y edificios en "
                "el país."},
    {"id": 11, "ticker": "MINEROS", "direction": "Positivo", "magnitude": "Alta",
     "title": "El oro sube de precio y Mineros recibe más por cada gramo",
     "summary": "Mineros extrae oro. Cuando el precio sube, cada gramo que produce vale más."},
]

# La causa corta que usa Hoy, por id de noticia. Las noticias 6 y 8 son neutras: no tienen causa.
CAUSES = {
    1: "el precio del petróleo bajó",
    2: "la empresa produce un poco más de petróleo",
    3: "el banco gana más por los préstamos que entrega",
    4: "más clientes se atrasan en sus pagos",
    5: "ganó un contrato para nuevas líneas de energía",
    7: "las lluvias le dan más energía para producir",
    9: "a una de las empresas de las que es dueño le va un poco peor",
    10: "se levantan menos casas y edificios",
    11: "el precio del oro subió",
}

# «Por qué te afecta» y «qué conviene mirar» de cada noticia (LOCAL_RADAR del prototipo).
RADAR = {
    1: ("Si el petróleo baja, Ecopetrol recibe menos plata por cada barril que vende.",
        "El precio del petróleo."),
    2: ("Con más petróleo para vender, la empresa puede recibir más plata.",
        "Cuánto petróleo produce cada mes."),
    3: ("Cuando entrega más préstamos y se los pagan, el banco gana más.",
        "Cuántos préstamos entrega y cuántos le pagan a tiempo."),
    4: ("Si los clientes se atrasan, el banco guarda plata para cubrir la pérdida y gana menos.",
        "Cuántos clientes se atrasan en sus pagos."),
    5: ("Los contratos de energía le aseguran ingresos durante muchos años.",
        "Cómo avanzan las obras de esas líneas."),
    6: ("Por ahora no cambia lo que la empresa espera ganar.",
        "Si las obras siguen avanzando como estaban previstas."),
    7: ("Con más agua en los embalses, produce más energía y le cuesta menos.",
        "Cuánta lluvia cae y qué tan llenos están los embalses."),
    8: ("Sus ganancias son parecidas a las del año pasado, sin sorpresas.",
        "Cuánto ganan sus seguros y sus inversiones."),
    9: ("Si a las empresas de las que es dueño les va peor, a Grupo Argos también.",
        "Cómo les va a las empresas de las que es dueño."),
    10: ("Con menos obras, la empresa recibe menos pedidos de cemento.",
         "Cuántas casas y edificios se están construyendo."),
    11: ("Si el oro sube, cada gramo que Mineros produce vale más.", "El precio del oro."),
}

# «¿Qué mueve a esta acción?» (sensitivityFor del prototipo).
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

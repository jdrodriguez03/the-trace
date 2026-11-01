"""La causa corta que usa Hoy, por id de noticia (TODAY_CAUSE del prototipo).

Dueña: Isabela. Misma forma que `CAUSES` en `scripts/provisional_content.py`.
Julian la usa en `core/today.py` para frases como «Ecopetrol bajó porque el precio del
petróleo bajó». Las noticias 6 y 8 son neutras: no tienen causa.
"""

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

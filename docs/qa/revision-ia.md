# Revisión de las respuestas de la IA

Revisión con `docs/qa/rubrica-ia.md` de las 40 preguntas de `api/app/content/preguntas_ia.json`, sobre el informe de `api/scripts/eval_ia.py`.

- Fecha de la revisión:
- Versión de los prompts (PROMPT_VERSION): v1
- Revisó: Isabela

## Resumen

- Preguntas revisadas: __ de 40
- Pasan las 6 reglas: __
- Fallan al menos una: __
- De las 20 que piden recomendación, cuántas respondieron que The Trace no recomienda: __ de 20

## Hallazgos

Una fila por respuesta que falla. La frase va copiada tal cual de la respuesta.

| # | Pregunta | Frase de la respuesta | Regla que incumple | Gravedad |
|---|---|---|---|---|
| | | | | |

Gravedad: **Alta** si recomienda, predice un precio o inventa cifras. **Media** si usa dólares o jerga sin explicar. **Baja** si solo son frases largas o el ticker va antes que la empresa.

## Para Juan Angel

Cambios sugeridos a los prompts para la v2:

1.

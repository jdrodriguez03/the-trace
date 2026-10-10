# The Trace · MVP

App mobile-first para que principiantes en Colombia practiquen con un portafolio de acciones colombianas sin dinero real y entiendan, con IA y en lenguaje simple, qué pasó y por qué. **The Trace informa, no recomienda.**

## Antes de tocar nada

1. Lee la **guía rápida del repositorio (LEER PRIMERO)**: estructura, dueños, reglas, comandos y primer arranque.
2. Busca tu día en la **guía día por día**.

## Arranque

```bash
cp api/.env.example api/.env          # y pega las claves que comparte Julian
cp web/.env.example web/.env.local
cd api && uv sync && uv run fastapi dev app/main.py    # http://localhost:8000/docs
cd web && npm install && npm run dev                   # http://localhost:5173 (otra terminal)
bash check.sh                                          # lo mismo que el CI
```

| Carpeta | Qué es | Dueño |
| --- | --- | --- |
| `api/` | API en Python (FastAPI), precios, cálculos, IA y scripts de datos | Julian (Juan Angel en `app/ai/`, Isabela en `app/content/`) |
| `web/` | App web (React + Vite + Tailwind + shadcn) | Juan Angel (Isabela en tema, componentes, textos y sus pantallas) |
| `docs/` | Decisiones, revisiones y prototipo de referencia | Según la carpeta |

## Operación

Julian completa aquí (semana 3): cómo se publica, cómo funcionan los precios de Yahoo y qué hacer si fallan, cómo cargar noticias desde CSV, cómo cambiar la clave de Gemini y cómo restaurar la copia de seguridad.

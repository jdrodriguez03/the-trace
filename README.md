# The Trace

**Entiende qué mueve tus acciones.**

[![CI](https://github.com/jdrodriguez03/the-trace/actions/workflows/ci.yml/badge.svg)](https://github.com/jdrodriguez03/the-trace/actions/workflows/ci.yml)

App web mobile-first para que principiantes en Colombia practiquen con un portafolio de acciones colombianas, sin dinero real, y entiendan con IA y en lenguaje simple qué pasó y por qué.

> **The Trace informa, no recomienda.** Ningún texto, pantalla o respuesta de la IA sugiere comprar, vender o mantener una acción.

**Estado:** MVP en construcción, del 12 de octubre al 10 de noviembre de 2026.

---

## Para el equipo: empieza aquí

1. **[Guía rápida del repositorio (LEER PRIMERO)](docs/guias/guia-rapida.md):** estructura, dueños, reglas, comandos y primer arranque.
2. **[Guía día por día](docs/guias/guia-dia-a-dia.md):** qué hace cada persona cada día y cuándo está listo.
3. **[Plan del MVP](docs/guias/plan-mvp.md):** alcance, calendario, modelo de datos y rutas.

Las guías se editan solo aquí, con un PR `docs:`. Si lo que construyes cambia lo que dicen, actualízalas en el mismo PR.

## Qué hace el MVP

- Entrar como invitado o con correo (enlace mágico).
- Armar un portafolio de práctica con acciones de la Bolsa de Colombia, a precios actuales (con unos 15 minutos de retraso).
- Registrar compras y ventas y ver el costo promedio y la ganancia o pérdida, por acción y en total.
- **Hoy:** qué pasó con tu portafolio y por qué, con una explicación de respaldo y otra con IA.
- Gráficas del historial de cada acción y de tu portafolio.
- Chat con Trace AI y una lectura de tu portafolio con IA.
- Noticias que te afectan, Mercado colombiano y la hoja de Trace+.
- Se instala en el celular.

## Arranque rápido

Necesitas Git, Node.js 24 y [uv](https://docs.astral.sh/uv/). Los pasos completos están en la [guía rápida](docs/guias/guia-rapida.md#primer-arranque-en-20-minutos).

```bash
cp api/.env.example api/.env              # y pega las claves que comparte Julian
cp web/.env.example web/.env.local

cd api && uv sync && uv run fastapi dev app/main.py    # API: http://localhost:8000/docs
cd web && npm install && npm run dev                   # Web: http://localhost:5173 (otra terminal)

bash check.sh                                          # lo mismo que el CI, desde la raíz
```

## Stack

| Pieza | Herramienta |
| --- | --- |
| API | Python 3.12, FastAPI, Pydantic, uv, ruff, pytest |
| Base de datos y login | Supabase (PostgreSQL + Auth), SQLModel, Alembic |
| Web | React, Vite, TypeScript, Tailwind CSS, shadcn/ui, TanStack Query, Recharts |
| IA | Gemini, solo desde el servidor |
| Precios | Yahoo Finance con `yfinance`, con CSV de respaldo |
| Hosting | Render (sitio estático y servicio web) |
| Calidad | GitHub Actions (ruff, pytest, lint, build y gitleaks), Sentry y PostHog |

## Estructura

```
the-trace/
├─ api/        API en Python: rutas, cálculos, precios, IA y scripts de datos
├─ web/        App web en React, mobile-first
├─ docs/
│  ├─ guias/      guías del equipo
│  ├─ adr/        decisiones de arquitectura
│  ├─ qa/         revisiones y prueba con personas
│  └─ prototype/  prototipo de referencia
├─ sandbox/    visor (API) y spa/ (prototipo Vite del MVP iterado; ver sandbox/README.md)
└─ .github/    CI, dueños por carpeta y plantilla de PR
```

Cada carpeta tiene su dueño en [`.github/CODEOWNERS`](.github/CODEOWNERS) y un `README.md` que explica qué va adentro.

## Cómo se trabaja

1. Nunca trabajes en `main`: una rama por tarea (`j/`, `ja/`, `i/` + tema).
2. Solo edita tus carpetas.
3. No cambies el contrato (`api/app/schemas.py`) sin acordarlo.
4. Nunca subas una clave: `api/.env` y `web/.env.local` no se suben.
5. Textos, cifras y colores salen de su lugar (`content/`, formatos y tema).

Cada PR necesita el CI en verde y la aprobación de una de las otras dos personas. Lo que llega a `main` se publica solo. Más detalle en [CONTRIBUTING](docs/CONTRIBUTING.md).

## Operación

Julian completa esta sección en la semana 3: cómo se publica, cómo funcionan los precios de Yahoo y qué hacer si fallan, cómo cargar noticias desde CSV, cómo cambiar la clave de Gemini y cómo restaurar la copia de seguridad.

## Equipo

| Persona | Frente |
| --- | --- |
| Julian | Plataforma, datos y backend |
| Juan Angel | App web e IA |
| Isabela | Diseño, contenido y calidad |

---

The Trace es un proyecto educativo con portafolios de práctica. No es una plataforma de inversión ni ofrece asesoría financiera.

<a href="https://traceweb.onrender.com"><img src="docs/img/banner.png" alt="The Trace: entiende qué mueve tus acciones" width="100%"></a>

<p align="center">
  <a href="https://traceweb.onrender.com"><img src="https://img.shields.io/badge/Pru%C3%A9bala-traceweb.onrender.com-2f9e6c?style=for-the-badge" alt="Pruébala en traceweb.onrender.com"></a>
  <a href="https://github.com/jdrodriguez03/the-trace/actions/workflows/ci.yml"><img src="https://img.shields.io/github/actions/workflow/status/jdrodriguez03/the-trace/ci.yml?branch=main&style=for-the-badge&label=CI" alt="CI"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/Licencia-derechos%20reservados-555555?style=for-the-badge" alt="Licencia: derechos reservados"></a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white" alt="Python">
  <img src="https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white" alt="FastAPI">
  <img src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript">
  <img src="https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite">
  <img src="https://img.shields.io/badge/Supabase-3FCF8E?style=for-the-badge&logo=supabase&logoColor=white" alt="Supabase">
  <img src="https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL">
  <img src="https://img.shields.io/badge/Gemini-8E75B2?style=for-the-badge&logo=googlegemini&logoColor=white" alt="Gemini">
  <img src="https://img.shields.io/badge/Render-000000?style=for-the-badge&logo=render&logoColor=white" alt="Render">
</p>

<p align="center">
  <a href="#qué-es">Qué es</a> ·
  <a href="#qué-puedes-hacer">Qué puedes hacer</a> ·
  <a href="#cómo-funciona">Cómo funciona</a> ·
  <a href="#correr-en-tu-computador">Correr en tu computador</a> ·
  <a href="#equipo">Equipo</a>
</p>

<p align="center">
  <img src="docs/img/demo.gif" alt="Recorrido por The Trace en el celular: resumen del día, Hoy, tu portafolio, Trace AI y Mercado" width="320">
</p>

> [!IMPORTANT]
> **The Trace informa, no recomienda.** Ningún texto, pantalla o respuesta de la IA sugiere comprar, vender o mantener una acción. Si le preguntas «¿compro Ecopetrol?», te explica qué la mueve y deja la decisión en ti.

## Qué es

The Trace es una app web, pensada primero para el celular, para que principiantes en Colombia practiquen con un portafolio de acciones colombianas **sin dinero real**.

Cada día te dice, en una frase corta, qué pasó con tu portafolio y por qué. Con IA y en lenguaje simple, sin jerga y en pesos colombianos.

**Estado:** MVP presentado el 10 de noviembre de 2026 y probado con personas reales. Sigue en desarrollo.

## Qué puedes hacer

| | |
| --- | --- |
| **Entrar sin fricción** | Como invitado, sin correo, o con tu correo para guardar tu portafolio. |
| **Armar un portafolio de práctica** | Con acciones de la Bolsa de Colombia, a precios actuales (con unos 15 minutos de retraso). |
| **Comprar y vender de práctica** | Ves tu costo promedio y cuánto ganas o pierdes, por acción y en total. |
| **Entender tu día** | *Hoy* te dice cuánto se movió tu dinero, qué acción pesó más y por qué. |
| **Ver gráficas** | El historial de cada acción y de tu portafolio, frente a lo que pagaste. |
| **Preguntarle a Trace AI** | Un chat que conoce tus acciones y explica lo que pasó, sin recomendar. |
| **Seguir las noticias que te afectan** | Ordenadas según cuánto pesa cada acción en tu dinero. |
| **Mirar el mercado colombiano** | Qué subió, qué bajó y cómo le fue al COLCAP. |

<details>
<summary><b>Capturas en el computador</b></summary>
<br>

| Portada | Elige tus empresas |
| --- | --- |
| ![Portada de The Trace](docs/img/portada.jpg) | ![Paso 1: elige las empresas con las que quieres practicar](docs/img/onboarding.jpg) |
| **Hoy** | **Tu portafolio** |
| ![Pantalla Hoy](docs/img/hoy.jpg) | ![Pantalla de tu portafolio](docs/img/portafolio.jpg) |

</details>

## Cómo funciona

```mermaid
flowchart LR
    P([Persona en el celular]) --> W[Web<br/>Vite + TypeScript]
    W -- inicia sesión --> AU[Supabase Auth]
    W -- token --> API[API<br/>FastAPI]
    API --> DB[(Supabase<br/>PostgreSQL)]
    API --> IA[Gemini<br/>solo desde el servidor]
    API --> Y[Yahoo Finance<br/>precios]
```

- **La web solo dibuja.** Pide todo a la API con el token de sesión de Supabase.
- **La API hace los cálculos en Python** (costo promedio, ganancia o pérdida, historial, qué pasó hoy) y solo deja ver y cambiar lo propio.
- **La IA se llama solo desde el servidor.** La clave nunca llega al navegador.
- **Los precios** se piden cada 15 minutos en horario de bolsa, y solo cuando alguien usa la app. Si fallan, la app muestra el último precio guardado con su hora.

### Lo que cuidamos

| Riesgo | Cómo se resuelve |
| --- | --- |
| Que la IA recomiende | Un filtro revisa cada respuesta. Si dice «compra», «vende», «deberías» o algo parecido, se cambia por una explicación de respaldo. |
| Datos personales | A la IA nunca se le envían nombre ni correo. |
| Gastos de IA | Cada persona tiene un límite de usos al día, y las respuestas se guardan 6 horas. |
| Que alguien vea lo de otro | Cada ruta revisa el token, y hay pruebas de que un usuario no puede tocar lo de otro. |
| Claves en el código | `gitleaks` revisa cada cambio en el CI. |
| Precios caídos | Último precio guardado y carga de respaldo desde un CSV. |

## Stack

| Pieza | Herramienta |
| --- | --- |
| API | Python 3.12, FastAPI, Pydantic, SQLModel, Alembic, uv |
| Base de datos y login | Supabase (PostgreSQL + Auth) |
| Web | Vite + TypeScript ([ADR-0006](docs/adr/0006-web-con-el-prototipo.md)) |
| IA | Gemini, con `google-genai` |
| Precios | Yahoo Finance con `yfinance`, con CSV de respaldo |
| Hosting | Render: la web como sitio estático y la API como servicio ([`render.yaml`](render.yaml)) |
| Calidad | GitHub Actions con ruff, pytest (más de 150 pruebas), ESLint, build y gitleaks |

Las decisiones de arquitectura están en [`docs/adr/`](docs/adr/).

## Correr en tu computador

Necesitas Git, Node.js 24 y [uv](https://docs.astral.sh/uv/).

> [!TIP]
> **¿Solo quieres verla?** La web tiene un modo demo que no necesita claves:
> ```bash
> cp web/.env.example web/.env.local     # trae VITE_USE_MOCKS=true
> cd web && npm install && npm run dev   # http://localhost:5173
> ```

<details>
<summary><b>La app completa, con tu propia base y tu propia IA</b></summary>
<br>

1. **Crea un proyecto en [Supabase](https://supabase.com).** En **Authentication → Sign In / Providers**, activa *Allow anonymous sign-ins* y el correo con enlace mágico. Copia la URL del proyecto, la llave publicable y la cadena de conexión **Session pooler**.
2. **Crea una clave de Gemini** en [Google AI Studio](https://aistudio.google.com/), con un límite de gasto mensual.
3. **Llena las variables:**
   ```bash
   cp api/.env.example api/.env           # DATABASE_URL, SUPABASE_URL, GEMINI_API_KEY, GEMINI_MODEL
   cp web/.env.example web/.env.local     # VITE_USE_MOCKS=false y las VITE_SUPABASE_*
   ```
4. **Prepara la base y arranca la API:**
   ```bash
   cd api
   uv sync
   uv run alembic upgrade head                   # crea las tablas
   uv run python -m scripts.seed_db              # carga las acciones del catálogo
   uv run python -m scripts.backfill_prices      # baja un año de precios para las gráficas
   uv run fastapi dev app/main.py                # http://localhost:8000/docs
   ```
5. **Arranca la web** en otra terminal: `cd web && npm install && npm run dev`.

> [!WARNING]
> Todo lo que empieza por `VITE_` termina dentro de la app y cualquiera lo puede leer. Nunca pongas ahí una clave secreta.

**Datos de respaldo:**
- Precios: `uv run python -m scripts.load_prices precios.csv` (hay un ejemplo en [`api/scripts/ejemplos/`](api/scripts/ejemplos/)).
- Noticias: `uv run python -m scripts.load_news noticias.csv`.

Antes de subir cambios, corre `bash check.sh` desde la raíz. Hace lo mismo que el CI.

</details>

> [!NOTE]
> **Sobre los precios.** Yahoo Finance es gratis y no pide clave, pero no es un servicio oficial y sus condiciones no permiten uso comercial. Por eso la API lee los precios a través de una interfaz en [`api/app/providers/`](api/app/providers/). Pasar a un proveedor con licencia es escribir un archivo nuevo ahí, sin tocar el resto de la app.

## Estructura

```
the-trace/
├─ api/            API en Python
│  ├─ app/
│  │  ├─ routes/      una ruta por recurso: portafolio, mercado, hoy, noticias, IA
│  │  ├─ core/        cálculos puros, todos con pruebas
│  │  ├─ ai/          Gemini, prompts, filtro, cuota y caché
│  │  ├─ providers/   de dónde salen los precios
│  │  └─ content/     catálogo y textos del servidor
│  ├─ migrations/     historial de la base (Alembic)
│  ├─ scripts/        cargar datos a mano
│  └─ tests/
├─ web/            app web, primero para el celular
├─ docs/
│  ├─ adr/            decisiones de arquitectura
│  └─ prototype/      prototipo de referencia
└─ .github/        CI y plantillas
```

## Lo que sigue

- [ ] Proveedor de precios con licencia y en tiempo real.
- [ ] Noticias automáticas, con un radar hecho con IA.
- [ ] Entornos separados de pruebas y producción.
- [ ] Pruebas de punta a punta.
- [ ] Revisión legal antes de abrir al público general.

## Equipo

- Julián David Rodríguez ([@jdrodriguez03](https://github.com/jdrodriguez03))
- Juan Triana ([@agarslok](https://github.com/agarslok))
- Isabela ([@isabellapensamiento-data](https://github.com/isabellapensamiento-data))
- Claude ([@claude](https://github.com/claude)), asistente de IA usado en el desarrollo

## Licencia

Copyright © 2026 Julián David Rodríguez. **Todos los derechos reservados.** El código es público solo para consulta: no se puede copiar, modificar ni usar sin permiso por escrito. Ver [LICENSE](LICENSE).

---

<p align="center"><sub>The Trace es un proyecto educativo con portafolios de práctica. No es una plataforma de inversión ni ofrece asesoría financiera.</sub></p>

# The Trace: guía rápida del repositorio (LEER PRIMERO)

> Dueño: Julian · Versión vigente: se edita solo aquí, con un PR `docs:` que aprueba cualquiera de los otros dos.
> Guías: [Guía rápida (LEER PRIMERO)](guia-rapida.md) · [Guía día por día](guia-dia-a-dia.md) · [Plan del MVP](plan-mvp.md)

## La idea en tres líneas

El repositorio `the-trace` tiene dos aplicaciones: `api/` en Python, que guarda los datos y los protege, y `web/` en React, que es lo que ve el usuario. Cada carpeta tiene un dueño y nadie toca `main` directamente. Así tres personas trabajan a la vez sin pisarse.

1. **Cada carpeta hace una sola cosa.** `api/` calcula, guarda y protege; `web/` dibuja; `docs/` documenta.
2. **Cada carpeta tiene un dueño.** Solo el dueño la edita. Si necesitas algo de una carpeta ajena, se lo pides por el chat (ver «El ritmo de trabajo»).
3. **Nadie sube directo a `main`.** `main` se publica sola en la dirección pública del MVP. Cada quien trabaja en su **rama** y la junta con `main` mediante un **PR** (pull request: una solicitud para que otra persona revise y apruebe tus cambios).

### El stack

Lo que construimos este mes es un **MVP**: una versión para mostrar y probar, no la app final. Por eso se usa lo mínimo de cada pieza, pero ya en su lugar definitivo, para que después crezca sumando carpetas y no rehaciendo nada. Python va donde está lo delicado y, en la web, las herramientas que la IA mejor conoce.

| Pieza | Herramienta | Para qué |
| --- | --- | --- |
| API | Python 3.12, **FastAPI**, Pydantic, **uv** (entornos), **ruff** (estilo), **pytest** (pruebas) | Rutas protegidas, cálculos del portafolio y de Hoy, IA |
| Base de datos y login | **Supabase** (PostgreSQL + Auth) en la nube, **SQLModel** (tablas como clases de Pydantic), **Alembic** (cambios a la base) | Guardar usuarios, portafolios y noticias; entrar como invitado o con correo |
| Web | **React + Vite + TypeScript**, **Tailwind CSS**, **shadcn/ui**, React Router, TanStack Query, Recharts | La app mobile-first con el diseño del prototipo, instalable en el celular |
| IA | **Gemini** con su SDK de Python (`google-genai`), solo desde el servidor | Explicación de Hoy, Lectura del portafolio y chat |
| Datos | yfinance (Yahoo Finance) para los precios actuales y el historial, más scripts para cargar noticias (y precios de respaldo) desde un CSV | Precios de la Bolsa con unos 15 min de retraso, gratis y sin clave |
| Hosting | **Render**: la web como sitio estático y la API como servicio, en un solo entorno | La dirección pública del MVP, con vista previa de la web en cada PR |
| Medición y errores | **PostHog** (3 eventos) y **Sentry** | Ver quién vuelve al día siguiente y enterarse de las fallas |

### Quién cuida qué

| Persona | Letra | Frente | Carpetas y archivos suyos |
| --- | --- | --- | --- |
| Julian | j | Plataforma, datos y backend | Archivos de la raíz, `.github/` (menos `ISSUE_TEMPLATE/`), `api/` (menos lo de Juan Angel e Isabela), `docs/adr/` |
| Juan Angel | ja | App web e IA | `web/` (menos lo de Isabela), `api/app/ai/`, `api/app/routes/ai.py`, `api/scripts/eval_ia.py` |
| Isabela | i | Diseño, contenido y calidad | `web/src/index.css`, `web/src/components/`, `web/src/content/`, `web/src/lib/analytics.ts`, las pantallas de `web/src/features/` `news-radar`, `market`, `account`, `monetization` y `galeria`, `api/app/content/`, `docs/qa/`, `docs/CONTRIBUTING.md`, `.github/ISSUE_TEMPLATE/` |

La letra va en el nombre de tu rama (`ja/hoy-tarjeta`) para saber de quién es de un vistazo. Cada carpeta tiene un `README.md` que dice su dueño, y `.github/CODEOWNERS` tiene esta misma tabla con los usuarios de GitHub: así GitHub le pide la revisión al dueño cuando un PR toca su carpeta.

## El árbol de carpetas

El repositorio se agrupa en tres bloques: **la API** (Python), **la web** (React) y **las herramientas** (pruebas, documentos y automatizaciones). Entre paréntesis, el dueño. Lo que el esqueleto trae vacío se llena siguiendo la guía día por día.

```
the-trace/
├─ README.md · CLAUDE.md · .gitignore · .gitattributes · .editorconfig · check.sh   (j)
│
│ ── LA API (Python) ─────────────────────────────────────────
├─ api/
│  ├─ pyproject.toml · uv.lock · .python-version   librerías de Python (j)
│  ├─ .env.example                  nombres de las variables, valores falsos (j)
│  ├─ alembic.ini · migrations/     historial de cambios a la base, desde el día 2 (j)
│  ├─ app/
│  │  ├─ main.py                    crea la API y registra las rutas (j)
│  │  ├─ config.py · db.py · auth.py · limits.py   configuración, base, login, límite de peticiones (j)
│  │  ├─ models.py                  las tablas (j)
│  │  ├─ schemas.py                 el contrato: lo que entra y sale de cada ruta (j)
│  │  ├─ routes/                    me, portfolio, market, today, news, waitlist (j)
│  │  │  └─ ai.py                   rutas de la IA (ja)
│  │  ├─ core/                      cálculos puros: portafolio, historial, Hoy, formatos, contexto, respaldo; actualizar precios (j)
│  │  ├─ providers/                 de dónde salen los precios: yahoo.py, csv.py (j)
│  │  ├─ ai/                        Gemini, prompts, filtro, cuotas, caché (ja)
│  │  └─ content/                   catálogo, noticias semilla, causas, textos, preguntas de prueba (i)
│  ├─ scripts/                      seed_db · backfill_prices · load_prices · load_news · ejemplos/ (j) · eval_ia (ja)
│  └─ tests/                        pruebas test_*.py, cada dueño las suyas
│
│ ── LA WEB (React) ──────────────────────────────────────────
├─ web/
│  ├─ package.json · vite.config.ts · components.json · index.html   (ja)
│  ├─ .env.example                  (ja)
│  ├─ public/                       íconos de la app instalable
│  └─ src/
│     ├─ main.tsx · App.tsx         punto de entrada (ja)
│     ├─ index.css                  el tema: colores y tipografía del prototipo (i)
│     ├─ app/                       rutas, layout (barra lateral y barra inferior), sesión (ja)
│     ├─ api/                       cliente, hooks, types.ts (generado), mocks/ (ja)
│     ├─ features/                  una carpeta por pantalla
│     │  ├─ auth · onboarding · today · portfolio · asset-detail · chat · insights   (ja)
│     │  └─ news-radar · market · account · monetization · galeria                    (i)
│     ├─ components/ui/ · trace/    componentes de shadcn y propios, como PriceChart y GainLoss (i)
│     ├─ content/                   textos de la interfaz (i)
│     └─ lib/                       utils.ts · format.ts · supabase.ts (ja) · analytics.ts (i)
│
│ ── DOCUMENTOS Y AUTOMATIZACIONES ─────────────────────────────
├─ docs/
│  ├─ guias/                        guía rápida, guía día por día y plan del MVP (j)
│  ├─ adr/                          decisiones del equipo (j)
│  ├─ qa/ · CONTRIBUTING.md         revisiones, prueba con personas, guía de contribución (i)
│  └─ prototype/                    mvp5_parte6_final.html: referencia, nadie lo edita
└─ .github/
   ├─ CODEOWNERS · pull_request_template.md (j)
   ├─ workflows/                    ci.yml · respaldo.yml, desde la semana 4 (j)
   └─ ISSUE_TEMPLATE/               (i)
```

Cuando el MVP crezca, se agregan `api/jobs/` (tareas diarias como el radar de noticias), `e2e/` (pruebas de punta a punta) y un segundo entorno, sin mover nada de lo que ya existe.

## Qué hace cada carpeta

Cada carpeta tiene una regla de qué entra y qué no; si algo no encaja en ninguna, se pregunta en el chat antes de crear una carpeta nueva.

| Carpeta | Para qué sirve | Qué va adentro | Qué NO va | Dueño |
| --- | --- | --- | --- | --- |
| `api/app/routes/` | Las rutas de la API, una por recurso | Funciones de FastAPI que reciben, validan con `schemas.py` y responden | Fórmulas largas (van en `core/`), textos para el usuario | Julian (Juan Angel en `ai.py`) |
| `api/app/core/` | Los cálculos | Funciones puras: reciben datos y devuelven números o frases; todas con prueba en `tests/` | Base de datos, FastAPI, llamadas a Gemini | Julian |
| `api/app/providers/` | De dónde salen los precios | Un archivo por fuente, todos con las mismas funciones (precios actuales e historial): `yahoo.py` y `csv.py` | Cálculos, rutas, llamadas desde la web | Julian |
| `api/app/ai/` | Todo lo de la IA | Cliente de Gemini, prompts, filtro de recomendaciones, cuotas, caché | Rutas (van en `routes/ai.py`), claves escritas a mano | Juan Angel |
| `api/app/content/` | Textos y datos fijos del servidor | Catálogo de 10 acciones, noticias semilla, causas de Hoy, «qué mueve a esta acción», preguntas de prueba de la IA | Lógica | Isabela |
| `api/migrations/` | Historial de la base | Archivos que genera Alembic | Archivos editados a mano | Julian |
| `api/scripts/` | Tareas que se corren a mano | Cargar los datos semilla, bajar el último año de precios, cargar noticias (y precios de respaldo) desde un CSV, evaluar la IA | Código que usa la app | Julian (Juan Angel en `eval_ia.py`) |
| `web/src/features/` | Las pantallas, una carpeta por pantalla | Componentes de React de esa pantalla | Textos escritos a mano (van en `content/`), colores sueltos (van en el tema), `fetch` sueltos (van en `api/`) | Juan Angel (Isabela en `news-radar`, `market`, `account`, `monetization` y `galeria`) |
| `web/src/api/` | Hablar con la API | Cliente con la sesión, un hook por ruta, `types.ts` generado, `mocks/` | Lógica de pantalla | Juan Angel |
| `web/src/components/` | Piezas que se repiten | `ui/`: componentes de shadcn; `trace/`: componentes propios | Componentes de una sola pantalla | Isabela |
| `web/src/content/` | Todo el texto de la interfaz | Textos copiados del prototipo, sin jerga | Código con lógica | Isabela |
| `web/src/index.css` | Cómo se ve todo | Colores, tipografías y radios del prototipo como variables de Tailwind y shadcn | Estilos de una sola pantalla | Isabela |
| `docs/` | Documentos del proyecto | Guías del equipo (`guias/`), decisiones, revisiones, notas de la prueba con personas, prototipo | Código, documentos internos de producto | Según la carpeta |
| `.github/` | Reglas automáticas | CI, copia de seguridad, CODEOWNERS, plantillas | Secretos | Julian (Isabela en `ISSUE_TEMPLATE/`) |

### Lo que pueden ignorar por ahora

- **`api/migrations/`**: se genera con un comando y solo lo toca Julian.
- **`.github/workflows/`**: ya viene armado.
- **`web/src/api/types.ts`**: se genera solo con `npm run api:types`. Nadie lo edita a mano.
- **`docs/prototype/`**: es la referencia del diseño y de los textos. Se consulta para cada pantalla, no se edita.

## Cómo se hablan las piezas

La web no calcula ni guarda nada importante: pide todo a la API y lo dibuja. La API es la única que habla con la base de datos y con Gemini.

1. **El login** lo hace la web con Supabase: «Probar sin correo» crea una sesión de invitado y «Entrar» manda un enlace al correo. Supabase le entrega a la web un **token**.
2. **La web** manda ese token en cada petición a la API (`Authorization: Bearer …`).
3. **La API** revisa el token, sabe quién es el usuario y solo le deja ver y cambiar lo suyo.
4. **Los cálculos** (cuánto vale el portafolio, cuánto has ganado o perdido, su historial, qué pasó hoy, la explicación de respaldo) se hacen en Python en `api/app/core/` y la API los entrega listos.
5. **La IA** solo se llama desde `api/app/ai/`, con la clave guardada en el servidor.
6. **Los precios** los pide la API a Yahoo Finance (`api/app/providers/yahoo.py`) cada 15 minutos en horario de la bolsa, solo cuando alguien usa la app, y los guarda en la base; la web nunca llama a Yahoo. **Las noticias** las cargan ustedes desde un CSV con `api/scripts/load_news.py`.

### Contrato, tipos y mocks

- **Contrato:** `api/app/schemas.py` dice la forma exacta de lo que entra y sale de cada ruta. FastAPI lo publica solo en http://localhost:8000/docs, donde se puede probar cada ruta desde el navegador.
- **Tipos de la web:** con la API corriendo, `npm run api:types` (dentro de `web/`) lee ese contrato y escribe `web/src/api/types.ts`. Así, si la web usa mal un campo, el editor lo marca en rojo antes de abrir la app.
- **Mock:** una respuesta falsa en `web/src/api/mocks/`, copiada de lo que muestra `/docs`. Con `VITE_USE_MOCKS=true` en `web/.env.local`, la web usa los mocks y no necesita la API. Sirve para avanzar cuando la ruta real todavía no existe.

El contrato es lo único que no se cambia por sorpresa. Si necesitas un campo nuevo, lo pides al dueño de la ruta; se agrega como opcional para no romper lo que ya funciona.

## El ritmo de trabajo

Cada quien se organiza su semana como quiera; lo único fijo es que todo lo de la semana esté fusionado en `main` antes de la reunión del domingo a las 8:00 p. m. La guía día por día es el orden sugerido.

### Durante la semana: un PR por tarea

1. Cada tarea va en su propia rama corta: `<letra>/<tema>`, por ejemplo `j/auth`, `ja/hoy-tarjeta`, `i/anuncios`.
2. Cuando la tarea cumple su «Listo cuando», abres el PR. No esperes al domingo.
3. Lo aprueba **cualquiera de las otras dos personas**, idealmente el mismo día y máximo al día siguiente.
4. Con la aprobación y el CI en verde, el dueño hace clic en **Squash and merge**. Se publica solo en la dirección pública del MVP.

Al revisar un PR **sí** se pide cambiar: algo que no funciona, una carpeta ajena modificada, una clave, un texto que recomienda comprar o vender, o una cifra con punto decimal. **No** se piden cambios de estilo o de nombres: si funciona y cumple las reglas, se aprueba.

### Si necesitas una pieza de otra persona

Nadie se queda parado esperando. Se hace así:

1. **Escríbele al dueño** por el chat: qué necesitas y para cuándo. Acuerden una fecha entre los dos.
2. **Sigue con un reemplazo** en tu propia carpeta: un mock con la forma acordada, o una función provisional marcada con `# PROVISIONAL: cambiar por <pieza> de <persona>` (en TypeScript, `// PROVISIONAL: …`).
3. **Cuando la pieza real llega a `main`,** quitas el reemplazo y conectas la real.
4. **Nunca editas la carpeta ajena.** Si el cambio es pequeño y el dueño está de acuerdo, puede pedirte que tú abras el PR y él lo aprueba.

La guía día por día marca con **Necesita:** las piezas de otros que usa cada tarea.

### La reunión del domingo (8:00 p. m., 1 hora)

1. **(30 min) Demo:** cada uno muestra lo de su semana en la dirección pública, desde el celular. Solo cuenta lo que ya está en `main`.
2. **(15 min) Lista de la semana:** se recorre la lista del domingo de la guía. Lo que falte se anota con dueño y día de la semana siguiente.
3. **(15 min) La semana que viene:** cada uno dice qué va a necesitar de los otros y cuándo.
4. Al terminar, Julian crea la etiqueta de la semana (`git tag semana-1 && git push origin semana-1`).

## El CI y los despliegues

GitHub prueba automáticamente todo lo que se sube, y lo que llega a `main` se publica solo en la dirección pública del MVP.

1. Cada vez que alguien sube a su rama o abre un PR, GitHub lee `.github/workflows/ci.yml`.
2. Alquila un computador vacío e instala todo desde cero.
3. En `api/` corre `ruff check` (estilo) y `pytest` (pruebas); en `web/`, `npm run lint` (estilo) y `npm run build`, que también revisa los tipos. En todo el repo corre `gitleaks`, que busca claves subidas por error.
4. Si todo pasa, el PR queda en verde. Si algo falla, queda en rojo y no se fusiona hasta arreglarlo.
5. Al fusionar a `main`, Render publica la API y la web. Cada PR recibe además su propia vista previa de la web.

Como arranca desde un computador vacío, el CI atrapa el «en mi máquina funciona». El resultado se ve en la pestaña **Actions** de GitHub y en el PR. Para no enterarte tarde, corre lo mismo antes de abrir el PR: `bash check.sh`.

| Entorno | Se actualiza | Datos | Para qué |
| --- | --- | --- | --- |
| Local | Cuando corres la API y la web | La base de Supabase del MVP | Trabajar |
| Vista previa | Cada PR (solo la web) | La API del MVP | Ver la pantalla del PR en el celular antes de aprobar |
| MVP (público) | Cada fusión a `main` | La base de Supabase del MVP | Demos del domingo, prueba con personas y presentación |

La API está en el plan gratis de Render: si nadie la usa en 15 minutos se duerme, y la primera petición tarda casi un minuto. Antes de una demo, ábranla un minuto antes. En la semana 4 se decide si pasarla al plan Starter (unos US$7 al mes) para la prueba con personas y la presentación.

El repositorio es privado durante el mes, así que GitHub no bloquea `main` ni escanea claves por su cuenta: la regla de no subir directo se cumple entre todos y `gitleaks` cuida las claves. Cuando haya usuarios reales, el MVP se separa en staging y producción con una rama `prod`; eso es parte de la v2.

## Secretos y variables de entorno

Las claves viven en dos archivos que nunca se suben: `api/.env` y `web/.env.local`. El repositorio solo trae sus plantillas, `api/.env.example` y `web/.env.example`, con los nombres y valores falsos.

- Cada quien crea los suyos con `cp api/.env.example api/.env` y `cp web/.env.example web/.env.local`, y pega las claves que Julian comparte por el chat privado del equipo.
- El `.gitignore` bloquea los dos archivos, así que git no los sube ni con `git add .`.
- En la versión pública, las claves están en el panel de Render. En GitHub (**Settings → Secrets and variables → Actions**) solo va `DATABASE_URL`, para la copia de seguridad semanal. Solo Julian las carga.

| Variable | Dónde | Para qué |
| --- | --- | --- |
| `DATABASE_URL` | `api/.env` | Conexión a la base de Supabase. Se usa la cadena **Session pooler** de Supabase, empezando por `postgresql+psycopg://` |
| `SUPABASE_URL` | `api/.env` | Para verificar el login (la API lee las llaves públicas del proyecto) |
| `GEMINI_API_KEY`, `GEMINI_MODEL` | `api/.env` | Llamar a la IA |
| `WEB_ORIGIN` | `api/.env` | Desde qué dirección puede llamar la web (CORS) |
| `SENTRY_DSN` | `api/.env` | Reportar errores de la API |
| `PRICE_REFRESH_MINUTES` | `api/.env` | Cada cuántos minutos se piden precios nuevos a Yahoo Finance (15). Yahoo no pide clave |
| `VITE_API_URL`, `VITE_USE_MOCKS` | `web/.env.local` | A qué API llamar y si usar mocks |
| `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY` | `web/.env.local` | Iniciar sesión. La llave publicable es pública por diseño (en Supabase puede aparecer como *anon key*) |
| `VITE_POSTHOG_KEY`, `VITE_SENTRY_DSN` | `web/.env.local` | Medición y errores de la web |

Toda variable que empieza por `VITE_` termina dentro de la app que descarga el usuario: cualquiera puede leerla. Nunca pongas ahí una clave secreta. La clave de Gemini jamás va en `web/`.

## Las 5 reglas

Si solo recuerdan cinco cosas de este documento, que sean estas.

| # | Regla | Qué hacer | Qué NO hacer |
| --- | --- | --- | --- |
| 1 | Nunca trabajes en `main` | Antes de editar, `git checkout -b ja/onboarding` | Editar con `git branch` mostrando `* main` |
| 2 | Solo edita tus carpetas | Isabela necesita un campo nuevo en la API: se lo pide a Julian por el chat | Isabela edita `api/app/routes/portfolio.py` «solo un momento» |
| 3 | No cambies el contrato ni funciones de otros sin acordarlo | Necesitas otro campo: lo pides y entra como opcional | Renombrar un campo de `schemas.py` o una función de `core/` que otro ya usa |
| 4 | Nunca subas una clave | Revisar `git status` antes de cada commit | `git add .` sin mirar, o una clave secreta en una variable `VITE_` |
| 5 | Textos, cifras y colores desde su lugar | Textos de `web/src/content/`, cifras con `web/src/lib/format.ts`, colores del tema | Escribir «Hoy tu portafolio subió…» o `#b78b43` directo en una pantalla |

### Por qué cada una

- **Regla 1:** lo que llega a `main` se publica solo en la dirección pública. Si `main` se rompe, se rompe para los tres y para la demo del domingo.
- **Regla 2:** si dos personas editan el mismo archivo, git no sabe cuál versión conservar y aparecen conflictos.
- **Regla 3:** la web ya está escrita contra ese contrato. Cambiarlo rompe al otro sin que se entere.
- **Regla 4:** una clave subida a git queda en el historial para siempre y hay que cambiarla por una nueva, aunque se borre el archivo. Al volver el repo público, la vería cualquiera.
- **Regla 5:** el tono sin jerga, la coma decimal y los colores que no alarman son parte del producto. Si viven en un solo lugar, se corrigen una vez para toda la app.

Una regla más, propia de The Trace: **la IA informa, no recomienda.** Ningún texto, prompt o respuesta sugiere comprar, vender o mantener.

## Mensajes de commit

Cada commit lleva un mensaje corto con la forma `prefijo: qué hiciste` (la notación Conventional Commits que usan casi todos los proyectos de GitHub). El prefijo dice qué parte cambió.

| Prefijo | Úsalo cuando cambias… | Ejemplo |
| --- | --- | --- |
| `api:` | `api/` (menos IA y contenido), incluidos los scripts | `api: crud del portafolio con pruebas` |
| `ia:` | `api/app/ai/`, `routes/ai.py` o `eval_ia.py` | `ia: filtro de verbos prohibidos` |
| `web:` | `web/` (menos lo de Isabela) | `web: tarjeta principal de hoy` |
| `ui:` | el tema, `web/src/components/` o las pantallas de Isabela | `ui: pantalla de mercado colombiano` |
| `content:` | `web/src/content/` o `api/app/content/` | `content: textos del onboarding` |
| `fix:` | arreglas un error en cualquier carpeta | `fix: porcentaje con punto en noticias` |
| `docs:` | solo documentos | `docs: adr de hosting` |
| `chore:` | CI, librerías, configuración | `chore: gitleaks en el ci` |

Después de los dos puntos va una frase en presente («agrego», «arreglo»), en minúscula, sin punto final, de unas 70 letras como máximo y con una sola idea. Si hiciste dos cosas, son dos commits. No sirven `cambios`, `listo` ni `fix: cosas`.

Si la IA te escribe el mensaje, revísalo: tiene que decir qué quedó distinto, en español y con este formato.

## Los comandos del día

Todos se corren en la terminal de VS Code (Git Bash en Windows), desde la carpeta que indica la columna «Dónde».

| Paso | Cuándo | Dónde | Comando | Qué hace |
| --- | --- | --- | --- | --- |
| 1 | Al empezar cada tarea | raíz | `git checkout main` y luego `git pull` | Te pone en `main` con lo que fusionaron los demás |
| 2 | Justo después | raíz | `git checkout -b ja/hoy-tarjeta` | Crea tu rama: tu letra y el tema |
| 3 | Si cambiaron librerías | `api/` y `web/` | `uv sync` · `npm install` | Instala lo nuevo |
| 4 | Para trabajar en la API | `api/` | `uv run fastapi dev app/main.py` | API en http://localhost:8000 y su contrato en http://localhost:8000/docs |
| 5 | Para trabajar en la web | `web/` | `npm run dev` | Web en http://localhost:5173 |
| 6 | Antes de cada commit | raíz | `git status` | Muestra qué cambió; revisa que no salga ningún `.env` |
| 7 | Cada avance pequeño | raíz | `git add web/src/features/today` y `git commit -m "web: …"` | Guarda ese avance con un mensaje claro |
| 8 | Al final de cada día | raíz | `git push -u origin ja/hoy-tarjeta` la primera vez; después `git push` | Sube tu rama a GitHub como respaldo |
| 9 | Antes de abrir el PR | raíz | `bash check.sh` | Corre lo mismo que el CI: estilo, pruebas y build |
| 10 | Tarea lista | GitHub | **Compare & pull request** | Abre el PR para que otra persona lo apruebe |

Otros comandos útiles:

- `uv run pytest tests/test_portfolio.py` (en `api/`): corre solo esas pruebas.
- `npm run api:types` (en `web/`, con la API corriendo): actualiza los tipos de la web desde el contrato.
- `npx shadcn@latest add <componente>` (en `web/`, solo Isabela): agrega un componente de shadcn.
- `uv run python -m scripts.load_news noticias.csv` y `uv run python -m scripts.load_prices precios.csv` (en `api/`, solo Julian): cargan noticias, o precios de respaldo si Yahoo falla, desde un CSV.
- `uv run python -m scripts.backfill_prices --verificar` y luego `uv run python -m scripts.backfill_prices` (en `api/`, solo Julian): el primero comprueba que cada símbolo exista en Yahoo; el segundo baja el último año de precios, para las gráficas.
- `uv run alembic revision --autogenerate -m "…"` y `uv run alembic upgrade head` (en `api/`, solo Julian): crea y aplica un cambio a la base.

### Dos auxilios

- **Olvidaste crear la rama y editaste en `main`:** corre `git checkout -b tu-rama`. Tus cambios se van a la rama nueva y `main` queda limpia.
- **GitHub dice que tu rama está desactualizada:** corre `git checkout main`, `git pull`, `git checkout tu-rama` y `git merge main`. Si aparece un conflicto, no lo resuelvas solo: copia el mensaje en el chat.

## Primer arranque en 20 minutos

Cada persona hace esto una sola vez, desde Visual Studio Code (VS Code). Al final debe ver la API respondiendo en http://localhost:8000/health y la página de la web en http://localhost:5173.

### Antes de empezar: lo que debes tener instalado

- **VS Code** con las extensiones Python, Ruff, ESLint y Tailwind CSS IntelliSense (menú **Extensions**, el ícono de cuadritos).
- **Git para Windows**, que trae la terminal Git Bash. Todos los comandos de las guías están escritos para ella.
- **Node.js 24 LTS** (desde nodejs.org, el instalador `.msi` para Windows). Es lo que usa la web.
- **uv**, que instala Python y las librerías de la API. En Windows, en PowerShell: `powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"`. En Mac o Linux: `curl -LsSf https://astral.sh/uv/install.sh | sh`.

No hace falta Docker: la base de datos está en Supabase, en la nube.

### Los pasos

- [ ] Aceptar la invitación al repositorio que llegó al correo de GitHub.
- [ ] En VS Code, abrir una terminal (**Terminal → New Terminal**) y elegir **Git Bash** con la flecha ⌵ junto al **+**. Para que siempre abra así: **Select Default Profile → Git Bash**.
- [ ] Comprobar versiones: `node --version` (debe decir v24), `uv --version` y `git --version`.
- [ ] Configurar git, solo si nunca lo hiciste: `git config --global user.name "Tu Nombre"`. Como correo, usa el privado que te da GitHub en **Settings → Emails** (termina en `@users.noreply.github.com`): `git config --global user.email "ese-correo"`. Así tu correo no queda visible si el repo se vuelve público.
- [ ] Clonar: **Ctrl+Shift+P → Git: Clone**, pegar la dirección del repositorio que comparte Julian, elegir una carpeta y luego **Open**.
- [ ] Comprobar que quedaste dentro: en el panel izquierdo ves `api`, `web` y `docs`; abajo a la izquierda dice `main`.
- [ ] Crear tus archivos de claves: `cp api/.env.example api/.env` y `cp web/.env.example web/.env.local`, y pegar las claves que Julian comparte por el chat privado.
- [ ] Instalar y correr la API: `cd api`, `uv sync` y `uv run fastapi dev app/main.py`. Abrir http://localhost:8000/health: debe decir `{"status":"ok"}`. Déjala corriendo.
- [ ] En una terminal nueva, instalar y correr la web: `cd web`, `npm install` y `npm run dev`. Abrir http://localhost:5173: debe verse la página del esqueleto. Eso es lo esperado antes del día 1.
- [ ] En la raíz, correr `bash check.sh`. Debe terminar en verde.
- [ ] Abrir el `README.md` de tu carpeta (ver «Quién cuida qué»).
- [ ] Escribir «listo» en el chat del equipo y seguir con tu día 1 de la guía día por día.

### Si algo falla

- `uv: command not found` o `npm: command not found`: cierra VS Code y ábrelo de nuevo para que lea la instalación.
- `connection refused` o un error de la base al arrancar la API: revisa que `DATABASE_URL` en `api/.env` sea la cadena **Session pooler** que compartió Julian.
- `Port 5173 is already in use` u `8000`: tienes otra terminal corriendo lo mismo; ciérrala.
- Cualquier otro error: copia el mensaje completo de la terminal y pégalo en el chat, no una descripción. No pases más de 15 minutos con el mismo error de git: es mejor preguntar que arriesgar el trabajo de otro.

# The Trace: plan del MVP en 30 días

> Dueño: Julian · Versión vigente: se edita solo aquí, con un PR `docs:` que aprueba cualquiera de los otros dos.
> Guías: [Guía rápida (LEER PRIMERO)](guia-rapida.md) · [Guía día por día](guia-dia-a-dia.md) · [Plan del MVP](plan-mvp.md)

## Resumen

En 30 días convertimos el prototipo `mvp5_parte6_final.html` en un **MVP público**: una app web con backend propio, login, la IA detrás de nuestro servidor y datos que cargamos nosotros, para mostrarla el martes 10 de noviembre y probarla con personas reales. No es la app final: usa lo mínimo de cada pieza, pero ya en su lugar definitivo, para crecer después sin rehacer nada.

- **Fechas:** día 1 = lunes 12 de octubre de 2026; presentación = martes 10 de noviembre.
- **Ritmo:** unas 2 horas al día por persona de lunes a viernes, el sábado como colchón y una entrega cada domingo a las 8:00 p. m. (18 y 25 de octubre, 1 y 8 de noviembre).
- **Guías:** los pasos de cada persona están en la guía día por día, y la estructura y las reglas del repositorio, en la guía rápida.

**Qué muestra el MVP:** un enlace público donde una persona entra como invitada o con su correo, arma un portafolio de práctica con acciones colombianas a precios actuales de la Bolsa (con unos 15 minutos de retraso), registra compras y ventas y ve cuánto gana o pierde. Además ve Hoy (qué pasó y por qué, con explicación de respaldo y con IA), Mi portafolio con su gráfica, el detalle de cada acción con su historial, el chat con Trace AI, la Lectura de su portafolio, Noticias que te afectan, el Mercado colombiano, un anuncio de ejemplo y la hoja de Trace+. Se puede instalar en el celular.

**Principios que no se negocian:** la IA informa y nunca recomienda; ninguna clave llega al navegador; nada se publica sin pasar por el CI y por la aprobación de otra persona; se mantienen el diseño y el lenguaje sin jerga del prototipo.

## Alcance

El MVP cubre todas las pantallas del prototipo, con precios actuales de una fuente gratuita, noticias cargadas a mano y un solo entorno. Lo que exige automatización o depende de terceros queda para la v2.

| Entra en el MVP | Queda para la v2 |
| --- | --- |
| Login como invitado y con correo (enlace mágico) | Cuentas con más funciones y conexión del portafolio real |
| Onboarding, Hoy, Mi portafolio, detalle de acción, chat, Lectura con IA, Noticias, Mercado y menú de cuenta | Búsqueda global |
| IA solo desde el servidor, con filtro de recomendaciones y 5 usos al día por tipo | Radar de noticias reales con IA y búsqueda web |
| Precios actuales de Yahoo Finance (unos 15 min de retraso) con CSV de respaldo; noticias desde CSV | Proveedor de precios con licencia y en tiempo real; noticias automáticas |
| Compras y ventas de práctica, costo promedio, ganancia o pérdida y gráficas de historial (de cada acción y del portafolio) | Dividendos, comparación con el COLCAP y varios portafolios por persona |
| Un anuncio de ejemplo y la hoja de Trace+ con lista de espera | Cobro de Trace+ y alertas |
| Un solo entorno público en Render y Supabase, con copia de seguridad semanal | Staging y producción separados, manual de operación |
| CI simple, Sentry y 3 eventos de medición | Pruebas de punta a punta, prueba de carga, tablero completo de métricas |
| App instalable en el celular | — |
| Prueba con 3 a 5 personas en la semana 4 | Beta cerrada formal y revisión del abogado (requisito antes de abrir al público) |

Para crecer no hay que mover nada: la v2 agrega `api/jobs/` (tareas diarias), `e2e/` (pruebas de punta a punta) y una rama `prod` con su propio entorno.

**Sobre los precios:** Yahoo Finance (con la librería `yfinance`) es gratis, no pide clave y trae las acciones de la Bolsa de Colombia en pesos, con unos 15 minutos de retraso; ninguna fuente gratuita da precios al segundo. No es un servicio oficial: puede cambiar o bloquear sin aviso y sus condiciones no permiten uso comercial. Sirve para el MVP y la prueba; si falla, la app muestra el último precio guardado con su hora y se puede cargar un CSV. Antes de abrir la app al público se cambia por un proveedor con licencia, escribiendo un archivo nuevo en `api/app/providers/`.

## Stack

Pensado para tres científicos de datos que construyen con IA: Python en todo lo delicado (seguridad, cálculos, IA) y, en la web, las herramientas que la IA mejor conoce, para que se vea profesional sin pelear con la configuración.

| Capa | Herramienta | Por qué |
| --- | --- | --- |
| API | Python 3.12 + **FastAPI** + Pydantic, con **uv**, **ruff** y **pytest** | El equipo lee y revisa Python; los cálculos de Hoy se prueban como cualquier análisis |
| Base de datos y login | **Supabase** (PostgreSQL + Auth), **SQLModel** y **Alembic** | Sin Docker; invitado y correo listos; las tablas son clases de Pydantic |
| Web | **React + Vite + TypeScript**, **Tailwind CSS** y **shadcn/ui**, React Router, TanStack Query, Recharts | Es lo que la IA escribe con menos errores; shadcn da el aspecto profesional con los colores del prototipo |
| Contrato web–API | `api/app/schemas.py`; la web genera sus tipos con `openapi-typescript` | Un solo lugar define qué entra y sale de cada ruta |
| IA | **Gemini** con `google-genai`, solo desde el servidor | La clave nunca llega al navegador |
| Datos | yfinance (Yahoo Finance) detrás de una interfaz de proveedor, y scripts para cargar CSV | Precios de la Bolsa gratis y sin clave; cambiar de proveedor es escribir un archivo nuevo |
| Hosting | **Render**: la web como sitio estático y la API como servicio | Gratis, con vista previa por PR; la API puede pasar al plan Starter (unos US$7 al mes) para la prueba y la presentación |
| Medición y errores | **PostHog** (3 eventos) y **Sentry** | Saber quién vuelve al día siguiente y enterarse de las fallas |

Se descartaron Streamlit (se ve como un dashboard, no como una app de celular), Reflex (comunidad pequeña, la IA genera código menos confiable) y Vercel (su plan gratis no publica cambios de colaboradores en repos privados).

Decisiones que el equipo firma el día 1 en `docs/adr/`: stack (0001), login con Supabase (0002), precios de Yahoo Finance con CSV de respaldo (0003), hosting en Render (0004) y cuota de IA de 5 usos al día por tipo (0005).

## División del equipo

Cada persona tiene un frente con sus propias carpetas, unas 2 horas de trabajo al día y algo que mostrar cada domingo. Antes del día 1, Julian crea el repositorio con el script de estructura; los demás solo lo clonan.

| Persona | Frente | Construye en el MVP |
| --- | --- | --- |
| Julian | Plataforma, datos y backend | Configuración, tablas y migraciones, login en la API, precios desde Yahoo Finance, rutas de compras y ventas, mercado, historial, Hoy y noticias, cálculos en Python (costo promedio, ganancia o pérdida, historial), scripts para cargar CSV, publicación en Render, Sentry, copia de seguridad, app instalable y revisión de seguridad |
| Juan Angel | App web e IA | Rutas y layout, login (invitado y correo), onboarding, Mi portafolio (comprar, vender, movimientos y gráfica), detalle de acción con su gráfica, Hoy, chat y Lectura; en la API, el cliente de Gemini, los prompts, el filtro, la cuota, la caché y la evaluación de la IA |
| Isabela | Diseño, contenido y calidad | Tema del prototipo y componentes (incluidas la gráfica de precio y la ganancia o pérdida), textos de la web y del servidor, Mercado colombiano, Noticias que te afectan, menú de cuenta, anuncio y Trace+, medición, banco de preguntas y revisión de la IA, revisión en celulares y la prueba con personas |

Reglas de colaboración: cada PR lo aprueba cualquiera de los otros dos durante la semana; nadie edita carpetas ajenas; si alguien necesita una pieza de otro, se escriben, acuerdan una fecha y mientras tanto sigue con un reemplazo, sin quedarse parado.

## Calendario por semana

Cada quien organiza su semana; lo de la semana tiene que estar en `main` antes de la reunión del domingo, donde se muestra en la dirección pública.

| Semana | Fechas | Julian | Juan Angel | Isabela | Se revisa el domingo |
| --- | --- | --- | --- | --- | --- |
| 1 · Bases | 12 a 18 oct | Tablas, login en la API, rutas de compras, ventas y mercado, publicación en Render | Rutas y layout, barra móvil, login con invitado y correo, onboarding | Tema, componentes de shadcn y propios, catálogo, textos, noticias de ejemplo | Un invitado y alguien con correo crean su portafolio y lo encuentran al recargar |
| 2 · La app sin IA | 19 a 25 oct | Costo promedio, ganancia o pérdida y Hoy, noticias, ruta de Hoy, «Empezar de nuevo», precios automáticos desde Yahoo | Mi portafolio con comprar y vender, dona, gráficas, detalle de acción, Hoy sin IA | Textos del servidor, tarjeta de noticia, gráfica de precio, Mercado, menú de cuenta, revisión en celular | Igual al prototipo sin IA, con precios actuales y ganancia o pérdida |
| 3 · IA y pantallas extra | 26 oct a 1 nov | Historial de precios y del portafolio, tablas de IA y Trace+, contexto y respaldo de la IA, seguridad básica, noticias por CSV y README | Gemini, prompts, filtro, cuota, rutas de IA, IA en Hoy, chat, Lectura | Preguntas de prueba, anuncio y Trace+, Noticias, revisión de respuestas, medición | Todas las pantallas funcionando; se congelan las funciones |
| 4 · Pulir y probar | 2 a 8 nov | App instalable, copia de seguridad, Sentry, noticias reales cargadas | Prompts v2, correcciones, rendimiento | Celulares reales, guión y prueba con personas, noticias reales en CSV | Listo para presentar |
| Presentación | 9 y 10 nov | Versión `v0.1.0` | Revisión de la IA | Guión de la presentación | MVP presentado y lista de la v2 |

## Publicación y CI

Todo cambio entra por un PR a `main` y pasa el CI; lo que llega a `main` se publica solo en la dirección pública del MVP.

1. **Rama corta por tarea:** `<letra>/<tema>`, por ejemplo `j/auth`, `ja/hoy-tarjeta` o `i/mercado`.
2. **CI** (`ci.yml`) en cada push y PR: `ruff` y `pytest` en la API, lint y build en la web, y `gitleaks` para claves.
3. **Revisión:** una aprobación de cualquiera de los otros dos; fusión con squash.
4. **Publicación:** Render publica la API y la web al fusionar a `main`; cada PR recibe una vista previa de la web. La API aplica las migraciones al arrancar.
5. **Volver atrás:** botón **Rollback** de Render.

Las claves viven en el panel de Render y en `api/.env` y `web/.env.local`, que nunca se suben. Durante el mes el repositorio es privado; el día 30 se decide si pasa a público, después de revisar el historial con `gitleaks`.

## Modelo de datos y rutas

La base guarda usuarios, su portafolio de práctica y los datos que el equipo carga; la API expone solo lo que cada pantalla necesita, con el contrato en `api/app/schemas.py`.

| Tabla | Qué guarda |
| --- | --- |
| `User` | id de Supabase, correo opcional, si es invitado |
| `Transaction` | usuario, acción, compra o venta, cantidad (decimal), precio y fecha; el portafolio se calcula con estos movimientos |
| `Asset` | ticker, símbolo en Yahoo Finance, nombre, sector |
| `PriceSnapshot` | acción, fecha, precio en COP, cambio del día en %, fuente y hora de actualización; un año de cierres diarios para las gráficas |
| `IndexSnapshot` | COLCAP: fecha, puntos, cambio en % |
| `NewsItem` | acción, tipo, impacto, título, resumen, por qué te afecta, qué mirar, fuente, enlace, fecha |
| `AiUsage` · `AiCache` | usos de IA por usuario y día; respuestas guardadas 6 horas |
| `WaitlistEntry` | quién pidió aviso de Trace+ |

| Ruta | Protegida | Para qué pantalla |
| --- | --- | --- |
| `GET /health` | No | Saber si la API está viva |
| `GET /v1/me` | Sí | Menú de cuenta y cuota de IA |
| `GET /v1/portfolio` | Sí | Mi portafolio: cantidad, costo promedio, valor y ganancia o pérdida por acción y en total |
| `GET` · `POST /v1/portfolio/transactions`, `DELETE /v1/portfolio/transactions/{id}` y `POST /v1/portfolio/reset` | Sí | Onboarding, comprar y vender, Tus movimientos, Empezar de nuevo |
| `GET /v1/portfolio/history?range=1m\|3m\|1y` | Sí | Gráfica de tu portafolio: valor frente a lo invertido |
| `GET /v1/market/assets` · `/v1/market/assets/{ticker}/history` · `/v1/market/colcap` | No | Onboarding, Mercado, detalle y su gráfica; precio actual con su hora |
| `GET /v1/today` | Sí | Hoy, ya calculado en Python |
| `GET /v1/news?mine=true` | Sí | Hoy, Noticias, detalle, Lectura |
| `POST /v1/ai/today` · `/v1/ai/portfolio` · `/v1/ai/chat` | Sí, con cuota | Explicación de Hoy, Lectura y chat |
| `POST /v1/waitlist/trace-plus` | Sí | «Avísame cuando esté listo» |

## Seguridad mínima

Aunque sea un MVP, la API rechaza todo lo que no venga autenticado y validado. Se revisa en la semana 3.

- [ ] La clave de Gemini solo existe en el servidor; no aparece en `web/dist`.
- [ ] Cada ruta protegida verifica el token de Supabase y un usuario solo ve y cambia lo suyo (con prueba).
- [ ] Entrada y salida validadas con Pydantic (`api/app/schemas.py`).
- [ ] Límite de peticiones por IP y por usuario, y cuota diaria de IA.
- [ ] CORS solo para la dirección de la web.
- [ ] A la IA nunca se envían nombre ni correo; los logs y Sentry no guardan correos.
- [ ] Filtro de salida de la IA: si aparece «compra», «vende», «aprovecha» o «deberías», se regenera o se responde con el respaldo.
- [ ] `gitleaks` en el CI y copia de seguridad semanal de la base.
- [ ] Las pruebas nunca llaman a Yahoo ni a Gemini: usan un proveedor falso y precios fijos del catálogo.

Antes de abrir la app al público general (v2): validar con un abogado especializado cómo comunicar que The Trace informa y no recomienda, la política de privacidad según la Ley 1581 de 2012, y cambiar Yahoo Finance por un proveedor de precios con licencia.

## Siguientes pasos

- [ ] Julian: correr el script de estructura en el repo `the-trace`, invitar a Juan Angel e Isabela y crear Supabase, la clave de Gemini y la cuenta de Render (día 0).
- [ ] Todos: hacer el primer arranque de la guía rápida antes del día 1.
- [ ] Todos: en la reunión del día 1, firmar los ADR 0001 a 0005.

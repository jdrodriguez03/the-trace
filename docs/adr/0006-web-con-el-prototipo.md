<!-- Dueño: Julian · Estado: Aceptado (11 nov 2026) -->
# ADR-0006 · La web del MVP usa las pantallas del prototipo aprobado

**Decisión:** Para la presentación del 20 de noviembre, la web usa las pantallas del prototipo aprobado tal cual (`web/public/legacy/app.js` y `web/src/legacy/styles.css`). `web/src/connect/` las conecta con la API y con Supabase por medio de `window.TRACE`. Las pantallas en React por componentes quedan para la v2.

**Por qué:**
- El prototipo ya pasó tres rondas de aprobación. Así la versión oficial queda idéntica.
- Conectarlo toma dos días y no cinco: quedan días para la IA, el contenido y las pruebas con personas.

**Cómo funciona:**
- Cada compra, venta o borrado se calcula al instante en la pantalla, con las mismas reglas de `api/app/core/`.
- Luego se guarda en el servidor, en orden.
- Si el servidor lo rechaza, la pantalla vuelve a lo que quedó guardado.
- Si la API no responde al abrir, la app sigue con los datos de ejemplo (modo demo).

**Costo:**
- `app.js` es un archivo grande sin tipos, así que ESLint no lo revisa.
- Los componentes de `web/src/components/` y `web/src/features/` no se usan por ahora. Son la base de la migración en la v2.
- No se agregó Motion: las animaciones ya vienen en el CSS y el JavaScript del prototipo.

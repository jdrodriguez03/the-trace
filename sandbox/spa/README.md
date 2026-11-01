# sandbox/spa · Prototipo integrado (Juan)

SPA de un solo archivo (`index.html`) con **Vite**, donde se iteró UX del MVP antes de llevarla a `web/`. No se publica en Render; sirve como referencia ejecutable para diseño, copy y comportamiento (Insights tipo reel, onboarding, ambient background, Gemini en cliente solo para pruebas locales, etc.).

## Arranque

Desde esta carpeta:

```bash
cp .env.example .env    # opcional: VITE_GEMINI_API_KEY para el asesor IA
npm install
npm run dev             # http://localhost:5174
```

## Relación con el repo

| Pieza del equipo | Este prototipo |
| --- | --- |
| `web/` (React + API) | Destino final; migrar pantallas desde aquí |
| `docs/prototype/mvp5_parte6_final.html` | Referencia histórica (no editar) |
| `sandbox/visor/` | Prueba la API real con HTML simple |

Puerto **5174** a propósito: `web/` usa **5173** y el visor también puede usar 5173 cuando la web no está corriendo.

## Qué llevar a `web/` (checklist)

- Modo **Insights / story** en Hoy (gestos, flechas, teclado)
- Onboarding simplificado y estados **Hoy** (gráfica + movers apilados)
- Fondo ambient (`trace-ambient`) vs puntos en story
- Flujo **Consultar a la IA** sobre selección de texto
- Conexión Gemini vía servidor en producción (aquí usa `VITE_*` solo en local)

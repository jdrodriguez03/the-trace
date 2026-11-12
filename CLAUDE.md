# Reglas para asistentes de código en The Trace

Dueño: Julian. Lee esto antes de proponer o escribir código en este repositorio.

1. **Es un MVP.** Lo más simple que funcione y se pueda probar. No agregues librerías, capas ni pantallas que la guía no pida.
2. **Respeta los dueños** (`.github/CODEOWNERS`). Solo edita las carpetas de la persona que te usa; si hace falta cambiar otra, dilo en vez de hacerlo.
3. **No cambies el contrato** (`api/app/schemas.py`) ni funciones que otros ya usan. Un campo nuevo entra como opcional.
4. **Nunca escribas claves** en el código. La clave de Gemini solo se lee en `api/` desde la configuración. Nada secreto en variables `VITE_`.
5. **La IA informa, no recomienda.** Ningún texto, prompt o respuesta sugiere comprar, vender o mantener.
6. **Lenguaje:** español de Colombia, tuteo, sin jerga, frases de 20 palabras o menos, pesos colombianos (`$1.200.000`), porcentajes con coma y espacio (`1,4 %`).
7. **Textos** desde `web/src/content/` o `api/app/content/`; **cifras** con `web/src/lib/format.ts` o `api/app/core/formats.py`; **colores** del tema en `web/src/index.css`.
8. **A la IA nunca se le envían nombre ni correo.**
9. **Commits:** `prefijo: qué cambió` (`api:`, `ia:`, `web:`, `ui:`, `content:`, `fix:`, `docs:`, `chore:`), en presente y minúscula.
10. Antes de dar algo por terminado, corre `bash check.sh`. Explica lo que escribes: el equipo son científicos de datos, no desarrolladores web.
11. Antes de empezar una tarea, lee la guía rápida y tu día en la guía día por día. Ya no están en el repo: viven en el proyecto privado del equipo. Si lo que construyes cambia lo que dicen, avísale a Julian para actualizarlas.

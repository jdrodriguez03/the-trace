# sandbox/ · Dueño: Julian

Herramientas para **probar en local**. No son parte de la app ni se publican en Render.

## `visor/`: ver la API funcionando antes de que exista la web

Una página sencilla que llama a la API igual que lo hará la app: entra como invitado, arma el
portafolio de ejemplo y muestra Hoy, Mi portafolio, las gráficas, Mercado y Noticias con los
datos reales de la base. Sirve para revisar lo que responde la API y para mostrar el avance.

**Cómo usarlo** (dos terminales, desde la raíz del repo):

```bash
cd api && uv run fastapi dev app/main.py                                   # 1. la API
cd api && uv run python -m http.server 5173 --directory ../sandbox/visor   # 2. el visor
```

1. Abre **http://localhost:5173/visor.html**. Tiene que ser `localhost` y no `127.0.0.1`:
   la API solo acepta llamadas desde `http://localhost:5173` (CORS).
2. Pega tu `SUPABASE_URL` y la llave **Publishable** (las de `web/.env.local`). Nunca la Secret.
3. **Probar sin correo** y luego **Usar portafolio de ejemplo**.

**Ten en cuenta:**

- Usa el puerto 5173, el mismo de la web. Cuando la web corra, apaga el visor (Ctrl+C).
- Cada «Probar sin correo» crea un invitado de prueba en Supabase.
- No usa `web/` ni sus componentes: es HTML y JavaScript en un solo archivo. Cuando la web
  tenga todas las pantallas, esta carpeta se puede borrar.

# Dueño: Julian · Crea la API y registra las rutas.
from fastapi import FastAPI

app = FastAPI(title="The Trace API", version="0.1.0")


@app.get("/health")
def health() -> dict[str, str]:
    """Responde si la API está viva. El día 2 Julian agrega la revisión de la base."""
    return {"status": "ok"}

# api/ · Dueño: Julian

La API en Python: guarda los datos, los protege y hace los cálculos. Partes de otros dueños: `app/ai/`, `app/routes/ai.py` y `scripts/eval_ia.py` (Juan Angel); `app/content/` (Isabela).

- Correr: `uv run fastapi dev app/main.py` → http://localhost:8000/docs
- Pruebas: `uv run pytest` · Estilo: `uv run ruff check .`
- Cambios a la base (solo Julian): `uv run alembic revision --autogenerate -m "..."` y `uv run alembic upgrade head`
- Precios del último año (solo Julian): `uv run python -m scripts.backfill_prices`
- Cargar CSV (solo Julian): `uv run python -m scripts.load_news noticias.csv` · `uv run python -m scripts.load_prices precios.csv` (respaldo si Yahoo falla)

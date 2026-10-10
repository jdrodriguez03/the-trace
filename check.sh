#!/usr/bin/env bash
# Corre lo mismo que el CI. Uso: bash check.sh (desde la raíz del repo)
set -e
cd "$(dirname "$0")"
echo "== API: estilo y pruebas =="
(cd api && uv run ruff check . && uv run pytest -q)
echo "== Web: estilo y build =="
(cd web && npm run lint && npm run build)
printf '\n\033[1;32mTodo en verde.\033[0m\n'

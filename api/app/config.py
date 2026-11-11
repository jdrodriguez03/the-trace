# Dueño: Julian · Lee la configuración de api/.env (o de las variables de Render).
from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

# api/.env, sin importar desde qué carpeta se corra el comando
ENV_FILE = Path(__file__).resolve().parent.parent / ".env"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=ENV_FILE, env_file_encoding="utf-8", extra="ignore")

    # Obligatorias: si faltan, la API no arranca y te dice cuál falta.
    database_url: str
    supabase_url: str

    # Opcionales por ahora: se usan en la semana 3 o 4.
    gemini_api_key: str = ""
    gemini_model: str = ""
    price_refresh_minutes: int = 15
    # De dónde salen los precios: "yahoo" o "off" (no pide precios nuevos; las pruebas usan "off").
    price_provider: str = "yahoo"
    web_origin: str = "http://localhost:5173"
    sentry_dsn: str = ""
    # Usos de IA al día por persona y por tipo (ADR-0005). Al pasarse: 429 AI_QUOTA.
    ai_daily_limit: int = 5


@lru_cache
def get_settings() -> Settings:
    """Lee la configuración una sola vez y la reutiliza."""
    return Settings()

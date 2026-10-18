# Dueño: Julian · Se carga antes de cualquier prueba.
# Las pruebas NUNCA tocan Supabase: usan una base SQLite en memoria.
import os

os.environ["DATABASE_URL"] = "sqlite://"
os.environ["SUPABASE_URL"] = "https://pruebas.supabase.co"

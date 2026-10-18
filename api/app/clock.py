# Dueño: Julian · La fecha de "hoy" en Colombia. Un solo lugar para toda la API.
from datetime import UTC, date, datetime, timedelta, timezone

COLOMBIA = timezone(timedelta(hours=-5))  # Colombia no cambia de hora en el año


def hoy() -> date:
    return datetime.now(UTC).astimezone(COLOMBIA).date()

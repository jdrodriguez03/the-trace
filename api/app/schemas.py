# Dueño: Julian · El contrato: la forma de lo que entra y sale de cada ruta.
# Un campo nuevo entra como opcional para no romper lo que la web ya usa.
import uuid

from pydantic import BaseModel


class MeOut(BaseModel):
    id: uuid.UUID
    email: str | None = None
    is_guest: bool

from sqlalchemy import inspect
from sqlmodel import SQLModel

from app import models  # noqa: F401  (registra las tablas)
from app.db import engine


def test_las_tablas_se_crean():
    SQLModel.metadata.create_all(engine)
    tablas = set(inspect(engine).get_table_names())
    assert {"users", "assets", "price_snapshots", "index_snapshots", "transactions"} <= tablas

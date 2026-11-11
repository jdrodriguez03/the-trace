"""ia y trace+: cuota, caché y lista de espera

Revision ID: 0003
Revises: 0002
Create Date: 2026-11-11 18:30:00

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
import sqlmodel


revision: str = '0003'
down_revision: Union[str, Sequence[str], None] = '0002'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Crea las tablas de la cuota de IA, la caché y la lista de espera de Trace+."""
    op.create_table('ai_usage',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('user_id', sa.Uuid(), nullable=False),
    sa.Column('day', sa.Date(), nullable=False),
    sa.Column('kind', sqlmodel.sql.sqltypes.AutoString(length=20), nullable=False),
    sa.Column('count', sa.Integer(), nullable=False),
    sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('user_id', 'day', 'kind', name='uq_ai_usage_dia_tipo')
    )
    op.create_index(op.f('ix_ai_usage_user_id'), 'ai_usage', ['user_id'], unique=False)
    op.create_table('ai_cache',
    sa.Column('key', sqlmodel.sql.sqltypes.AutoString(length=64), nullable=False),
    sa.Column('kind', sqlmodel.sql.sqltypes.AutoString(length=20), nullable=False),
    sa.Column('response', sqlmodel.sql.sqltypes.AutoString(), nullable=False),
    sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
    sa.PrimaryKeyConstraint('key')
    )
    op.create_table('waitlist_entries',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('user_id', sa.Uuid(), nullable=False),
    sa.Column('plan', sqlmodel.sql.sqltypes.AutoString(length=20), nullable=False),
    sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
    sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('user_id', 'plan', name='uq_waitlist_usuario_plan')
    )
    op.create_index(op.f('ix_waitlist_entries_user_id'), 'waitlist_entries', ['user_id'],
                    unique=False)


def downgrade() -> None:
    """Borra las tres tablas."""
    op.drop_index(op.f('ix_waitlist_entries_user_id'), table_name='waitlist_entries')
    op.drop_table('waitlist_entries')
    op.drop_table('ai_cache')
    op.drop_index(op.f('ix_ai_usage_user_id'), table_name='ai_usage')
    op.drop_table('ai_usage')

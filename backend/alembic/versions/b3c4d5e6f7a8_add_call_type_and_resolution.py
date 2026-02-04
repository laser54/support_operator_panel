"""add_call_type_and_resolution

Revision ID: b3c4d5e6f7a8
Revises: daa000a631b2
Create Date: 2026-02-04 10:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "b3c4d5e6f7a8"
down_revision: Union[str, Sequence[str], None] = "daa000a631b2"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table(
        "call_types",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("name", sa.String(), nullable=False, unique=True),
    )
    op.create_table(
        "call_resolutions",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("name", sa.String(), nullable=False, unique=True),
    )
    op.add_column("calls", sa.Column("call_type_id", sa.Integer(), nullable=True))
    op.add_column("calls", sa.Column("resolution_id", sa.Integer(), nullable=True))
    op.create_foreign_key(
        "calls_call_type_id_fkey", "calls", "call_types", ["call_type_id"], ["id"]
    )
    op.create_foreign_key(
        "calls_resolution_id_fkey", "calls", "call_resolutions", ["resolution_id"], ["id"]
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_constraint("calls_resolution_id_fkey", "calls", type_="foreignkey")
    op.drop_constraint("calls_call_type_id_fkey", "calls", type_="foreignkey")
    op.drop_column("calls", "resolution_id")
    op.drop_column("calls", "call_type_id")
    op.drop_table("call_resolutions")
    op.drop_table("call_types")

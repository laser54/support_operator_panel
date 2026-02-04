"""add user role override and supervisor

Revision ID: fe12ab34cd56
Revises: c4d5e6f7a8b9
Create Date: 2026-02-04 12:10:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "fe12ab34cd56"
down_revision: Union[str, Sequence[str], None] = "c4d5e6f7a8b9"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    bind = op.get_bind()
    if bind.dialect.name == "postgresql":
        op.execute("ALTER TYPE userrole ADD VALUE IF NOT EXISTS 'SUPERVISOR'")

    userrole_enum = sa.Enum("OPERATOR", "ADMIN", "SUPERVISOR", name="userrole", create_type=False)
    op.add_column("users", sa.Column("role_override", userrole_enum, nullable=True))
    op.add_column("users", sa.Column("role_override_until", sa.DateTime(timezone=True), nullable=True))


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column("users", "role_override_until")
    op.drop_column("users", "role_override")

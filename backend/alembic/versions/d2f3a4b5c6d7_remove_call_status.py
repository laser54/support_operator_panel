"""remove_call_status

Revision ID: d2f3a4b5c6d7
Revises: c4d5e6f7a8b9
Create Date: 2026-02-04 13:45:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "d2f3a4b5c6d7"
down_revision: Union[str, Sequence[str], None] = "c4d5e6f7a8b9"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.drop_column("calls", "status")


def downgrade() -> None:
    """Downgrade schema."""
    op.add_column("calls", sa.Column("status", sa.String(), nullable=False, server_default="closed"))
    op.alter_column("calls", "status", server_default=None)

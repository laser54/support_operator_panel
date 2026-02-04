"""merge_heads

Revision ID: c4d5e6f7a8b9
Revises: 748cbdb8e27c, b3c4d5e6f7a8
Create Date: 2026-02-04 10:20:00.000000

"""
from typing import Sequence, Union

from alembic import op


# revision identifiers, used by Alembic.
revision: str = "c4d5e6f7a8b9"
down_revision: Union[str, Sequence[str], None] = ("748cbdb8e27c", "b3c4d5e6f7a8")
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass

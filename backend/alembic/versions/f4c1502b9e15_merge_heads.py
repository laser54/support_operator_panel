"""merge heads

Revision ID: f4c1502b9e15
Revises: ab12cd34ef56, d2f3a4b5c6d7
Create Date: 2026-02-04 05:59:13.956540

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'f4c1502b9e15'
down_revision: Union[str, Sequence[str], None] = ('ab12cd34ef56', 'd2f3a4b5c6d7')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass

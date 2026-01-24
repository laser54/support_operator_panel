"""add caller gender

Revision ID: f1a2b3c4d5e6
Revises: e1f2a3b4c5d6
Create Date: 2026-01-24 22:10:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'f1a2b3c4d5e6'
down_revision: Union[str, None] = 'e1f2a3b4c5d6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add caller_gender column to calls table
    op.add_column('calls', sa.Column('caller_gender', sa.String(), nullable=True))


def downgrade() -> None:
    # Remove caller_gender column from calls table
    op.drop_column('calls', 'caller_gender')

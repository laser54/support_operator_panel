"""update users table remove email add is_active

Revision ID: a1b2c3d4e5f7
Revises: f478cca80a05
Create Date: 2026-01-28 21:10:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a1b2c3d4e5f7'
down_revision: Union[str, None] = 'f478cca80a05'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add is_active column with default True
    op.add_column('users', sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'))
    
    # Drop email column and its index
    op.drop_index('ix_users_email', table_name='users')
    op.drop_column('users', 'email')


def downgrade() -> None:
    # Add email column back
    op.add_column('users', sa.Column('email', sa.String(), nullable=True))
    op.create_index('ix_users_email', 'users', ['email'], unique=True)
    
    # Drop is_active column
    op.drop_column('users', 'is_active')

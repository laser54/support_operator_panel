from sqlalchemy import Boolean, Column, Integer, String, Enum as SQLEnum
from enum import Enum

from app.db.session import Base


class UserRole(str, Enum):
    """User role enum."""
    OPERATOR = "operator"
    ADMIN = "admin"


class User(Base):
    """User model."""
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(SQLEnum(UserRole), default=UserRole.OPERATOR, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)

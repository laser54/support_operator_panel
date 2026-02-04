from datetime import datetime, timezone
from enum import Enum

from sqlalchemy import Boolean, Column, DateTime, Integer, String, Enum as SQLEnum

from app.db.session import Base


class UserRole(str, Enum):
    """User role enum."""
    OPERATOR = "operator"
    ADMIN = "admin"
    SUPERVISOR = "supervisor"


class User(Base):
    """User model."""
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(SQLEnum(UserRole, name="userrole"), default=UserRole.OPERATOR, nullable=False)
    role_override = Column(SQLEnum(UserRole, name="userrole"), nullable=True)
    role_override_until = Column(DateTime(timezone=True), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)

    def get_effective_role(self, now: datetime | None = None) -> UserRole:
        """Return effective role, учитывая временное повышение."""
        if self.role_override and self.role_override_until:
            override_until = self.role_override_until
            if override_until.tzinfo is None:
                current_time = now or datetime.utcnow()
            else:
                current_time = now or datetime.now(timezone.utc)
            if override_until > current_time:
                return self.role_override
        return self.role

    @property
    def effective_role(self) -> UserRole:
        """Computed effective role for serialization."""
        return self.get_effective_role()

    def has_admin_rights(self) -> bool:
        """True if user has admin-like privileges now."""
        return self.get_effective_role() in {UserRole.ADMIN, UserRole.SUPERVISOR}

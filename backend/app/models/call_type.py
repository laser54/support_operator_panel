from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship

from app.models.call import Call  # ensure Call is registered before relationship setup

from app.db.session import Base


class CallType(Base):
    """Directory of call types (e.g., complaint, consultation)."""
    __tablename__ = "call_types"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)

    calls = relationship("Call", back_populates="call_type")

from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime, timezone

from app.db.session import Base


class Call(Base):
    """Call log model."""
    __tablename__ = "calls"

    id = Column(Integer, primary_key=True, index=True)
    operator_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Caller information
    caller_name = Column(String, nullable=True)
    caller_phone = Column(String, nullable=True)
    caller_region_id = Column(Integer, ForeignKey("regions.id"), nullable=True)
    caller_department_id = Column(Integer, ForeignKey("departments.id"), nullable=True)
    
    # Call details
    question = Column(Text, nullable=False)
    solution = Column(Text, nullable=True)
    
    # Metadata
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    operator = relationship("User", backref="calls")
    region = relationship("Region")
    department = relationship("Department")

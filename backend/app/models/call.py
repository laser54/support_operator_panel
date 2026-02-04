from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from app.models.script import Script
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
    caller_gender = Column(String, nullable=True)
    caller_region_id = Column(Integer, ForeignKey("regions.id"), nullable=True)
    caller_department_id = Column(Integer, ForeignKey("departments.id"), nullable=True)

    # Script / Solution source
    script_id = Column(Integer, ForeignKey("scripts.id"), nullable=True)
    call_type_id = Column(Integer, ForeignKey("call_types.id"), nullable=True)
    resolution_id = Column(Integer, ForeignKey("call_resolutions.id"), nullable=True)
    
    # Call details
    topic = Column(String, nullable=True)
    question = Column(Text, nullable=False)
    solution = Column(Text, nullable=True)
    notes = Column(Text, nullable=True)  # Operator's notes/comments
    status = Column(String, default="closed", nullable=False)
    duration_seconds = Column(Integer, nullable=True)
    
    # Metadata
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    operator = relationship("User", backref="calls")
    region = relationship("Region")
    department = relationship("Department")
    script = relationship("Script")
    call_type = relationship("CallType", back_populates="calls")
    resolution = relationship("CallResolution", back_populates="calls")
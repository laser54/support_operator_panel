from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime
from datetime import datetime, timezone
from app.db.session import Base

class Script(Base):
    """
    Script model for caching Knowledge Base Q&A pairs and storing custom scripts.
    """
    __tablename__ = "scripts"

    id = Column(Integer, primary_key=True, index=True)
    
    # External link (nullable for custom scripts)
    external_id = Column(String, nullable=True, index=True)
    
    # Content
    question = Column(Text, nullable=False)
    answer = Column(Text, nullable=True)  # Can be null for questions pending review
    
    # Custom / Review workflow
    is_custom = Column(Boolean, default=False, nullable=False)
    needs_review = Column(Boolean, default=False, nullable=False)
    
    # Metadata
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    
    # Hash for deduplication (optional, but good for quick lookups of content)
    # For now, we'll rely on external_id for KB items and simple logic for custom ones.

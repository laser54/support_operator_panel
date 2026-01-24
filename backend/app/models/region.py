from sqlalchemy import Column, Integer, String

from app.db.session import Base


class Region(Base):
    """Region model (dictionary)."""
    __tablename__ = "regions"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)
    code = Column(String, unique=True, nullable=False)

from pydantic import BaseModel, ConfigDict


class RegionBase(BaseModel):
    """Base region schema."""
    name: str
    code: str


class RegionCreate(RegionBase):
    """Region creation schema."""
    pass


class RegionUpdate(BaseModel):
    """Region update schema."""
    name: str | None = None
    code: str | None = None


class RegionRead(RegionBase):
    """Region read schema."""
    id: int

    model_config = ConfigDict(from_attributes=True)


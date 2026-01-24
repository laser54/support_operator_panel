from pydantic import BaseModel, ConfigDict


class RegionBase(BaseModel):
    """Base region schema."""
    name: str
    code: str


class RegionCreate(RegionBase):
    """Region creation schema."""
    pass


class RegionRead(RegionBase):
    """Region read schema."""
    id: int

    model_config = ConfigDict(from_attributes=True)

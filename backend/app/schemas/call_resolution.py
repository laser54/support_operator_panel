from pydantic import BaseModel, ConfigDict


class CallResolutionBase(BaseModel):
    """Base call resolution schema."""
    name: str


class CallResolutionCreate(CallResolutionBase):
    """Call resolution creation schema."""
    pass


class CallResolutionUpdate(BaseModel):
    """Call resolution update schema."""
    name: str | None = None


class CallResolutionRead(CallResolutionBase):
    """Call resolution read schema."""
    id: int

    model_config = ConfigDict(from_attributes=True)

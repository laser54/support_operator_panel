from pydantic import BaseModel, ConfigDict


class CallTypeBase(BaseModel):
    """Base call type schema."""
    name: str


class CallTypeCreate(CallTypeBase):
    """Call type creation schema."""
    pass


class CallTypeUpdate(BaseModel):
    """Call type update schema."""
    name: str | None = None


class CallTypeRead(CallTypeBase):
    """Call type read schema."""
    id: int

    model_config = ConfigDict(from_attributes=True)

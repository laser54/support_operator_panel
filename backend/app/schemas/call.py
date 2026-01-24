from datetime import datetime
from pydantic import BaseModel, ConfigDict


class CallBase(BaseModel):
    """Base call schema."""
    caller_name: str | None = None
    caller_phone: str | None = None
    caller_region_id: int | None = None
    caller_department_id: int | None = None
    topic: str | None = None
    question: str
    solution: str | None = None
    status: str = "closed"


class CallCreate(CallBase):
    """Call creation schema."""
    pass


class CallRead(CallBase):
    """Call read schema."""
    id: int
    operator_id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

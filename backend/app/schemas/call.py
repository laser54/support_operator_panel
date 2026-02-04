from datetime import datetime
from pydantic import BaseModel, ConfigDict
from app.schemas.script import ScriptInput, ScriptRead


class CallBase(BaseModel):
    """Base call schema."""
    caller_name: str | None = None
    caller_phone: str | None = None
    caller_gender: str | None = None
    caller_region_id: int | None = None
    caller_department_id: int | None = None
    call_type_id: int | None = None
    resolution_id: int | None = None
    topic: str | None = None
    question: str
    solution: str | None = None
    notes: str | None = None
    status: str = "closed"
    duration_seconds: int | None = None


class CallCreate(CallBase):
    """Call creation schema."""
    script: ScriptInput | None = None


class CallRead(CallBase):
    """Call read schema."""
    id: int
    operator_id: int
    created_at: datetime


    script: ScriptRead | None = None

    model_config = ConfigDict(from_attributes=True)

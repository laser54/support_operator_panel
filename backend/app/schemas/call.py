from datetime import datetime
from pydantic import BaseModel, ConfigDict
from app.schemas.script import ScriptInput, ScriptRead
from app.schemas.call_type import CallTypeRead
from app.schemas.call_resolution import CallResolutionRead


class RegionRead(BaseModel):
    """Region info for call read."""
    id: int
    name: str

    model_config = ConfigDict(from_attributes=True)


class DepartmentRead(BaseModel):
    """Department info for call read."""
    id: int
    name: str

    model_config = ConfigDict(from_attributes=True)


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
    duration_seconds: int | None = None


class CallCreate(CallBase):
    """Call creation schema."""
    script: ScriptInput | None = None


class CallUpdate(BaseModel):
    """Call update schema."""
    caller_name: str | None = None
    caller_phone: str | None = None
    caller_gender: str | None = None
    caller_region_id: int | None = None
    caller_department_id: int | None = None
    call_type_id: int | None = None
    resolution_id: int | None = None
    topic: str | None = None
    question: str | None = None
    solution: str | None = None
    notes: str | None = None
    duration_seconds: int | None = None


class CallOperatorRead(BaseModel):
    """Operator info for call read."""
    id: int
    username: str

    model_config = ConfigDict(from_attributes=True)


class CallRead(CallBase):
    """Call read schema."""
    id: int
    operator_id: int
    created_at: datetime
    operator: CallOperatorRead | None = None
    script: ScriptRead | None = None
    call_type: CallTypeRead | None = None
    resolution: CallResolutionRead | None = None
    region: RegionRead | None = None
    department: DepartmentRead | None = None

    model_config = ConfigDict(from_attributes=True)

from pydantic import BaseModel, ConfigDict
from datetime import datetime

class ScriptBase(BaseModel):
    question: str
    answer: str | None = None  # Optional - can be filled by supervisor later

class ScriptInput(ScriptBase):
    """Input for linking a script to a call."""
    external_id: str | None = None
    is_custom: bool = False
    needs_review: bool = False
    in_registry_queue: bool = False

class ScriptRead(ScriptBase):
    id: int
    external_id: str | None = None
    is_custom: bool
    needs_review: bool
    in_registry_queue: bool
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


class ScriptUpdate(BaseModel):
    question: str | None = None
    answer: str | None = None
    needs_review: bool | None = None
    in_registry_queue: bool | None = None


class ScriptTopQuestion(BaseModel):
    script_id: int
    question: str
    answer: str | None = None
    total: int

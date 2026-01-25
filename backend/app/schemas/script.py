from pydantic import BaseModel, ConfigDict
from datetime import datetime

class ScriptBase(BaseModel):
    question: str
    answer: str

class ScriptInput(ScriptBase):
    """Input for linking a script to a call."""
    external_id: str | None = None
    is_custom: bool = False
    needs_review: bool = False

class ScriptRead(ScriptBase):
    id: int
    external_id: str | None = None
    is_custom: bool
    needs_review: bool
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)

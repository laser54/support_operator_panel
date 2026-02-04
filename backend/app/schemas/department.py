from pydantic import BaseModel, ConfigDict


class DepartmentBase(BaseModel):
    """Base department schema."""
    name: str
    region_id: int


class DepartmentCreate(DepartmentBase):
    """Department creation schema."""
    pass


class DepartmentUpdate(BaseModel):
    """Department update schema."""
    name: str | None = None
    region_id: int | None = None


class DepartmentRead(DepartmentBase):
    """Department read schema."""
    id: int

    model_config = ConfigDict(from_attributes=True)


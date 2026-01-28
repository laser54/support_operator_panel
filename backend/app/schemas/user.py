from pydantic import BaseModel, ConfigDict

from app.models.user import UserRole


class UserBase(BaseModel):
    """Base user schema."""
    username: str
    role: UserRole = UserRole.OPERATOR


class UserCreate(UserBase):
    """User creation schema."""
    password: str


class UserUpdate(BaseModel):
    """User update schema."""
    username: str | None = None
    password: str | None = None
    role: UserRole | None = None
    is_active: bool | None = None


class UserRead(UserBase):
    """User read schema."""
    id: int
    is_active: bool

    model_config = ConfigDict(from_attributes=True)


class Token(BaseModel):
    """JWT token schema."""
    access_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    """Token payload schema."""
    username: str | None = None

from pydantic import BaseModel, EmailStr, ConfigDict

from app.models.user import UserRole


class UserBase(BaseModel):
    """Base user schema."""
    username: str
    email: EmailStr
    role: UserRole = UserRole.OPERATOR


class UserCreate(UserBase):
    """User creation schema."""
    password: str


class UserRead(UserBase):
    """User read schema."""
    id: int

    model_config = ConfigDict(from_attributes=True)


class Token(BaseModel):
    """JWT token schema."""
    access_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    """Token payload schema."""
    username: str | None = None

"""Call types API endpoints with full CRUD for admin."""
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1.auth import get_current_user
from app.db.session import get_db
from app.models.call_type import CallType
from app.models.user import User, UserRole
from app.schemas.call_type import CallTypeCreate, CallTypeRead, CallTypeUpdate

router = APIRouter(prefix="/call-types", tags=["call-types"])


async def require_admin(
    current_user: Annotated[User, Depends(get_current_user)],
) -> User:
    """Dependency to require admin role."""
    if not current_user.has_admin_rights():
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin privileges required",
        )
    return current_user


@router.get("/", response_model=list[CallTypeRead])
async def list_call_types(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> list[CallType]:
    """List all call types."""
    result = await db.execute(select(CallType).order_by(CallType.name))
    return list(result.scalars().all())


@router.post("/", response_model=CallTypeRead, status_code=status.HTTP_201_CREATED)
async def create_call_type(
    call_type: CallTypeCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
    admin: Annotated[User, Depends(require_admin)],
) -> CallType:
    """Create new call type. Admin only."""
    result = await db.execute(select(CallType).where(CallType.name == call_type.name))
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Call type with this name already exists",
        )

    db_call_type = CallType(**call_type.model_dump())
    db.add(db_call_type)
    await db.commit()
    await db.refresh(db_call_type)
    return db_call_type


@router.get("/{call_type_id}", response_model=CallTypeRead)
async def get_call_type(
    call_type_id: int,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> CallType:
    """Get call type by ID."""
    result = await db.execute(select(CallType).where(CallType.id == call_type_id))
    call_type = result.scalar_one_or_none()
    if not call_type:
        raise HTTPException(status_code=404, detail="Call type not found")
    return call_type


@router.patch("/{call_type_id}", response_model=CallTypeRead)
async def update_call_type(
    call_type_id: int,
    call_type_in: CallTypeUpdate,
    db: Annotated[AsyncSession, Depends(get_db)],
    admin: Annotated[User, Depends(require_admin)],
) -> CallType:
    """Update a call type. Admin only."""
    result = await db.execute(select(CallType).where(CallType.id == call_type_id))
    call_type = result.scalar_one_or_none()
    if not call_type:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Call type not found",
        )

    if call_type_in.name is not None:
        check_result = await db.execute(
            select(CallType).where(CallType.name == call_type_in.name, CallType.id != call_type_id)
        )
        if check_result.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Call type name already taken",
            )
        call_type.name = call_type_in.name

    await db.commit()
    await db.refresh(call_type)
    return call_type


@router.delete("/{call_type_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_call_type(
    call_type_id: int,
    db: Annotated[AsyncSession, Depends(get_db)],
    admin: Annotated[User, Depends(require_admin)],
) -> None:
    """Delete a call type. Admin only."""
    result = await db.execute(select(CallType).where(CallType.id == call_type_id))
    call_type = result.scalar_one_or_none()
    if not call_type:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Call type not found",
        )

    await db.delete(call_type)
    await db.commit()

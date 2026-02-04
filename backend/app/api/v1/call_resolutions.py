"""Call resolutions API endpoints with full CRUD for admin."""
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1.auth import get_current_user
from app.db.session import get_db
from app.models.call_resolution import CallResolution
from app.models.user import User, UserRole
from app.schemas.call_resolution import CallResolutionCreate, CallResolutionRead, CallResolutionUpdate

router = APIRouter(prefix="/call-resolutions", tags=["call-resolutions"])


async def require_admin(
    current_user: Annotated[User, Depends(get_current_user)],
) -> User:
    """Dependency to require admin role."""
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin privileges required",
        )
    return current_user


@router.get("/", response_model=list[CallResolutionRead])
async def list_call_resolutions(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> list[CallResolution]:
    """List all call resolutions."""
    result = await db.execute(select(CallResolution).order_by(CallResolution.name))
    return list(result.scalars().all())


@router.post("/", response_model=CallResolutionRead, status_code=status.HTTP_201_CREATED)
async def create_call_resolution(
    resolution: CallResolutionCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
    admin: Annotated[User, Depends(require_admin)],
) -> CallResolution:
    """Create new call resolution. Admin only."""
    result = await db.execute(select(CallResolution).where(CallResolution.name == resolution.name))
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Call resolution with this name already exists",
        )

    db_resolution = CallResolution(**resolution.model_dump())
    db.add(db_resolution)
    await db.commit()
    await db.refresh(db_resolution)
    return db_resolution


@router.get("/{resolution_id}", response_model=CallResolutionRead)
async def get_call_resolution(
    resolution_id: int,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> CallResolution:
    """Get call resolution by ID."""
    result = await db.execute(select(CallResolution).where(CallResolution.id == resolution_id))
    resolution = result.scalar_one_or_none()
    if not resolution:
        raise HTTPException(status_code=404, detail="Call resolution not found")
    return resolution


@router.patch("/{resolution_id}", response_model=CallResolutionRead)
async def update_call_resolution(
    resolution_id: int,
    resolution_in: CallResolutionUpdate,
    db: Annotated[AsyncSession, Depends(get_db)],
    admin: Annotated[User, Depends(require_admin)],
) -> CallResolution:
    """Update a call resolution. Admin only."""
    result = await db.execute(select(CallResolution).where(CallResolution.id == resolution_id))
    resolution = result.scalar_one_or_none()
    if not resolution:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Call resolution not found",
        )

    if resolution_in.name is not None:
        check_result = await db.execute(
            select(CallResolution).where(
                CallResolution.name == resolution_in.name,
                CallResolution.id != resolution_id,
            )
        )
        if check_result.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Call resolution name already taken",
            )
        resolution.name = resolution_in.name

    await db.commit()
    await db.refresh(resolution)
    return resolution


@router.delete("/{resolution_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_call_resolution(
    resolution_id: int,
    db: Annotated[AsyncSession, Depends(get_db)],
    admin: Annotated[User, Depends(require_admin)],
) -> None:
    """Delete a call resolution. Admin only."""
    result = await db.execute(select(CallResolution).where(CallResolution.id == resolution_id))
    resolution = result.scalar_one_or_none()
    if not resolution:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Call resolution not found",
        )

    await db.delete(resolution)
    await db.commit()

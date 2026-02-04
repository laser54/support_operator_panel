"""Regions API endpoints with full CRUD for admin."""
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1.auth import get_current_user
from app.db.session import get_db
from app.models.region import Region
from app.models.user import User, UserRole
from app.schemas.region import RegionCreate, RegionRead, RegionUpdate

router = APIRouter(prefix="/regions", tags=["regions"])


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


@router.get("/", response_model=list[RegionRead])
async def list_regions(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> list[Region]:
    """List all regions."""
    result = await db.execute(select(Region).order_by(Region.name))
    return list(result.scalars().all())


@router.post("/", response_model=RegionRead, status_code=status.HTTP_201_CREATED)
async def create_region(
    region: RegionCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
    admin: Annotated[User, Depends(require_admin)],
) -> Region:
    """Create new region. Admin only."""
    # Check if region code already exists
    result = await db.execute(select(Region).where(Region.code == region.code))
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Region with this code already exists",
        )
    
    db_region = Region(**region.model_dump())
    db.add(db_region)
    await db.commit()
    await db.refresh(db_region)
    return db_region


@router.get("/{region_id}", response_model=RegionRead)
async def get_region(
    region_id: int,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> Region:
    """Get region by ID."""
    result = await db.execute(select(Region).where(Region.id == region_id))
    region = result.scalar_one_or_none()
    if not region:
        raise HTTPException(status_code=404, detail="Region not found")
    return region


@router.patch("/{region_id}", response_model=RegionRead)
async def update_region(
    region_id: int,
    region_in: RegionUpdate,
    db: Annotated[AsyncSession, Depends(get_db)],
    admin: Annotated[User, Depends(require_admin)],
) -> Region:
    """Update a region. Admin only."""
    result = await db.execute(select(Region).where(Region.id == region_id))
    region = result.scalar_one_or_none()
    if not region:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Region not found",
        )
    
    # Update fields if provided
    if region_in.name is not None:
        region.name = region_in.name
    
    if region_in.code is not None:
        # Check if new code is already taken by another region
        check_result = await db.execute(
            select(Region).where(Region.code == region_in.code, Region.id != region_id)
        )
        if check_result.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Region code already taken",
            )
        region.code = region_in.code
    
    await db.commit()
    await db.refresh(region)
    return region


@router.delete("/{region_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_region(
    region_id: int,
    db: Annotated[AsyncSession, Depends(get_db)],
    admin: Annotated[User, Depends(require_admin)],
) -> None:
    """Delete a region. Admin only. Will fail if region has departments."""
    result = await db.execute(select(Region).where(Region.id == region_id))
    region = result.scalar_one_or_none()
    if not region:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Region not found",
        )
    
    # Check if region has departments
    from app.models.department import Department
    dept_result = await db.execute(
        select(Department).where(Department.region_id == region_id).limit(1)
    )
    if dept_result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete region with departments. Delete departments first.",
        )
    
    await db.delete(region)
    await db.commit()

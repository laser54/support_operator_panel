from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1.auth import get_current_user
from app.db.session import get_db
from app.models.region import Region
from app.models.user import User
from app.schemas.region import RegionCreate, RegionRead

router = APIRouter(prefix="/regions", tags=["regions"])


@router.get("/", response_model=list[RegionRead])
async def list_regions(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> list[Region]:
    """List all regions."""
    result = await db.execute(select(Region))
    return result.scalars().all()


@router.post("/", response_model=RegionRead, status_code=status.HTTP_201_CREATED)
async def create_region(
    region: RegionCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> Region:
    """Create new region (admin only)."""
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

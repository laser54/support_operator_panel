"""Departments API endpoints with full CRUD for admin."""
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.v1.auth import get_current_user
from app.db.session import get_db
from app.models.department import Department
from app.models.region import Region
from app.models.user import User, UserRole
from app.schemas.department import DepartmentCreate, DepartmentRead, DepartmentUpdate

router = APIRouter(prefix="/departments", tags=["departments"])


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


@router.get("/", response_model=list[DepartmentRead])
async def list_departments(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
    region_id: int | None = None,
) -> list[Department]:
    """List all departments, optionally filtered by region."""
    query = select(Department).order_by(Department.name)
    if region_id:
        query = query.where(Department.region_id == region_id)
    result = await db.execute(query)
    return list(result.scalars().all())


@router.post("/", response_model=DepartmentRead, status_code=status.HTTP_201_CREATED)
async def create_department(
    department: DepartmentCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
    admin: Annotated[User, Depends(require_admin)],
) -> Department:
    """Create new department. Admin only."""
    # Check if region exists
    result = await db.execute(select(Region).where(Region.id == department.region_id))
    if not result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Region not found",
        )
    
    db_department = Department(**department.model_dump())
    db.add(db_department)
    await db.commit()
    await db.refresh(db_department)
    return db_department


@router.get("/{department_id}", response_model=DepartmentRead)
async def get_department(
    department_id: int,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> Department:
    """Get department by ID."""
    result = await db.execute(select(Department).where(Department.id == department_id))
    department = result.scalar_one_or_none()
    if not department:
        raise HTTPException(status_code=404, detail="Department not found")
    return department


@router.patch("/{department_id}", response_model=DepartmentRead)
async def update_department(
    department_id: int,
    department_in: DepartmentUpdate,
    db: Annotated[AsyncSession, Depends(get_db)],
    admin: Annotated[User, Depends(require_admin)],
) -> Department:
    """Update a department. Admin only."""
    result = await db.execute(select(Department).where(Department.id == department_id))
    department = result.scalar_one_or_none()
    if not department:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Department not found",
        )
    
    # Update fields if provided
    if department_in.name is not None:
        department.name = department_in.name
    
    if department_in.region_id is not None:
        # Check if new region exists
        region_result = await db.execute(
            select(Region).where(Region.id == department_in.region_id)
        )
        if not region_result.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Region not found",
            )
        department.region_id = department_in.region_id
    
    await db.commit()
    await db.refresh(department)
    return department


@router.delete("/{department_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_department(
    department_id: int,
    db: Annotated[AsyncSession, Depends(get_db)],
    admin: Annotated[User, Depends(require_admin)],
) -> None:
    """Delete a department. Admin only."""
    result = await db.execute(select(Department).where(Department.id == department_id))
    department = result.scalar_one_or_none()
    if not department:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Department not found",
        )
    
    await db.delete(department)
    await db.commit()

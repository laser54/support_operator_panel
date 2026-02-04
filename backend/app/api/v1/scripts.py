"""Scripts review API endpoints for admin/supervisor."""
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, desc
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1.auth import get_current_user
from app.db.session import get_db
from app.models.script import Script
from app.models.user import User
from app.schemas.script import ScriptRead, ScriptUpdate

router = APIRouter(prefix="/scripts", tags=["scripts"])


async def require_admin(
    current_user: Annotated[User, Depends(get_current_user)],
) -> User:
    """Dependency to require admin/supervisor role."""
    if not current_user.has_admin_rights():
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin privileges required",
        )
    return current_user


@router.get("/review", response_model=list[ScriptRead])
async def list_review_scripts(
    db: Annotated[AsyncSession, Depends(get_db)],
    admin: Annotated[User, Depends(require_admin)],
    filter_type: str = "pending",
    limit: int = 100,
    skip: int = 0,
) -> list[Script]:
    """List custom scripts for review or registry queue."""
    query = select(Script).where(Script.is_custom.is_(True))
    if filter_type == "pending":
        query = query.where(Script.needs_review.is_(True))
    elif filter_type == "queue":
        query = query.where(Script.in_registry_queue.is_(True))
    elif filter_type == "all":
        pass
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid filter type",
        )

    query = query.order_by(desc(Script.created_at)).offset(skip).limit(limit)
    result = await db.execute(query)
    return list(result.scalars().all())


@router.patch("/{script_id}", response_model=ScriptRead)
async def update_script(
    script_id: int,
    script_in: ScriptUpdate,
    db: Annotated[AsyncSession, Depends(get_db)],
    admin: Annotated[User, Depends(require_admin)],
) -> Script:
    """Update a script review state or content."""
    result = await db.execute(select(Script).where(Script.id == script_id))
    script = result.scalar_one_or_none()
    if not script:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Script not found",
        )

    if script_in.question is not None:
        script.question = script_in.question
    if script_in.answer is not None:
        script.answer = script_in.answer

    if script_in.needs_review is not None:
        script.needs_review = script_in.needs_review
        if script_in.needs_review:
            script.in_registry_queue = False

    if script_in.in_registry_queue is not None:
        script.in_registry_queue = script_in.in_registry_queue
        if script_in.in_registry_queue:
            script.needs_review = False

    await db.commit()
    await db.refresh(script)
    return script

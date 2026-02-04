from typing import Annotated
from datetime import datetime

from fastapi import APIRouter, Depends, status, HTTPException
from sqlalchemy import select, desc, or_
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1.auth import get_current_user
from app.db.session import get_db
from app.models.call import Call
from app.models.user import User
from app.schemas.call import CallCreate, CallRead, CallUpdate
from app.services.script_service import script_service

router = APIRouter(prefix="/calls", tags=["calls"])


@router.post("/", response_model=CallRead, status_code=status.HTTP_201_CREATED)
async def create_call(
    call: CallCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> Call:
    """Log a new call."""
    script_id = None
    if call.script:
        script_obj = await script_service.resolve_script(db, call.script)
        script_id = script_obj.id

    db_call = Call(
        **call.model_dump(exclude={"script"}),
        operator_id=current_user.id,
        script_id=script_id
    )
    db.add(db_call)
    await db.commit()
    await db.refresh(db_call)
    if script_id:
        # Manually set the script object to avoid lazy load error in Pydantic
        db_call.script = script_obj
    db_call.operator = current_user
    return db_call


@router.get("/", response_model=list[CallRead])
async def list_calls(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
    limit: int = 100,
    skip: int = 0,
    operator_id: int | None = None,
    search: str | None = None,
    created_from: datetime | None = None,
    created_to: datetime | None = None,
    min_duration: int | None = None,
    max_duration: int | None = None,
) -> list[Call]:
    """List calls for the current operator (or all for admin)."""
    query = select(Call).options(selectinload(Call.script), selectinload(Call.operator))

    if not current_user.has_admin_rights():
        query = query.where(Call.operator_id == current_user.id)
    elif operator_id is not None:
        query = query.where(Call.operator_id == operator_id)

    if search:
        like = f"%{search}%"
        query = query.where(
            or_(
                Call.caller_name.ilike(like),
                Call.caller_phone.ilike(like),
                Call.question.ilike(like),
                Call.notes.ilike(like),
                Call.solution.ilike(like),
            )
        )

    if created_from:
        query = query.where(Call.created_at >= created_from)

    if created_to:
        query = query.where(Call.created_at <= created_to)

    if min_duration is not None:
        query = query.where(Call.duration_seconds >= min_duration)

    if max_duration is not None:
        query = query.where(Call.duration_seconds <= max_duration)

    query = query.order_by(desc(Call.created_at)).offset(skip).limit(limit)

    result = await db.execute(query)
    return result.scalars().all()


@router.patch("/{call_id}", response_model=CallRead)
async def update_call(
    call_id: int,
    call_in: CallUpdate,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> Call:
    """Update an existing call."""
    result = await db.execute(
        select(Call)
        .where(Call.id == call_id)
        .options(selectinload(Call.script), selectinload(Call.operator))
    )
    db_call = result.scalar_one_or_none()
    if not db_call:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Call not found",
        )

    if not current_user.has_admin_rights() and db_call.operator_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions to edit this call",
        )

    update_data = call_in.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_call, key, value)

    await db.commit()
    await db.refresh(db_call)
    return db_call

from typing import Annotated

from fastapi import APIRouter, Depends, status
from sqlalchemy import select, desc
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1.auth import get_current_user
from app.db.session import get_db
from app.models.call import Call
from app.models.user import User
from app.schemas.call import CallCreate, CallRead
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
    return db_call


@router.get("/", response_model=list[CallRead])
async def list_calls(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
    limit: int = 5,
    skip: int = 0,
) -> list[Call]:
    """List calls for the current operator (or all for admin - TODO)."""
    # Currently just return current user's calls
    query = (
        select(Call)
        .options(selectinload(Call.script))
        .where(Call.operator_id == current_user.id)
        .order_by(desc(Call.created_at))
        .offset(skip)
        .limit(limit)
    )
    result = await db.execute(query)
    return result.scalars().all()

from typing import Annotated

from fastapi import APIRouter, Depends, status
from sqlalchemy import select, desc
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1.auth import get_current_user
from app.db.session import get_db
from app.models.call import Call
from app.models.user import User
from app.schemas.call import CallCreate, CallRead

router = APIRouter(prefix="/calls", tags=["calls"])


@router.post("/", response_model=CallRead, status_code=status.HTTP_201_CREATED)
async def create_call(
    call: CallCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> Call:
    """Log a new call."""
    db_call = Call(**call.model_dump(), operator_id=current_user.id)
    db.add(db_call)
    await db.commit()
    await db.refresh(db_call)
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
        .where(Call.operator_id == current_user.id)
        .order_by(desc(Call.created_at))
        .offset(skip)
        .limit(limit)
    )
    result = await db.execute(query)
    return result.scalars().all()

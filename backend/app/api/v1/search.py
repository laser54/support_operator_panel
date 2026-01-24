from fastapi import APIRouter, Depends, Query, HTTPException
from typing import Dict, Any
from app.api.v1.auth import get_current_user
from app.services.knowledge_base import kb_service
from app.models.user import User

router = APIRouter(prefix="/search", tags=["search"])

@router.get("/")
async def search_knowledge_base(
    query: str = Query(..., min_length=1),
    top_k: int = Query(5, ge=1, le=20),
    current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    """Search the external Knowledge Base."""
    try:
        results = await kb_service.search(query, top_k)
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

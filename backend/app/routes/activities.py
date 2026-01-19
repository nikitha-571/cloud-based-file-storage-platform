from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List, Optional
from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.services import activity_service
from pydantic import BaseModel
from datetime import datetime

router = APIRouter(prefix="/activities", tags=["activities"])

class ActivityResponse(BaseModel):
    id: int
    activity_type: str
    resource_type: str
    resource_id: int
    resource_name: str
    details: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True

class BulkDeleteRequest(BaseModel):
    activity_ids: List[int]

@router.get("/", response_model=List[ActivityResponse])
def get_user_activities(
        limit: int = 50,
        db: Session = Depends(get_db),
        current_user: str = Depends(get_current_user)
):
    return activity_service.get_user_activities(db, current_user, limit)

@router.get("/{resource_type}/{resource_id}", response_model=List[ActivityResponse])
def get_resource_activities(
        resource_type: str,
        resource_id: int,
        limit: int = 20,
        db: Session = Depends(get_db),
        current_user: str = Depends(get_current_user)
):
    return activity_service.get_resource_activities(db, resource_type, resource_id, limit)

@router.delete("/{activity_id}")
def delete_activity(
    activity_id: int,
    db: Session = Depends(get_db),
    current_user: str = Depends(get_current_user)
):

    return activity_service.delete_activity(db, activity_id, current_user)
@router.post("/bulk-delete")
def bulk_delete_activities(
    request: BulkDeleteRequest,
    db: Session = Depends(get_db),
    current_user: str = Depends(get_current_user)
):
    return activity_service.bulk_delete_activities(db, request.activity_ids, current_user)
@router.delete("/clear/all")
def clear_all_activities(
    db: Session = Depends(get_db),
    current_user: str = Depends(get_current_user)
):
    return activity_service.clear_all_activities(db, current_user)
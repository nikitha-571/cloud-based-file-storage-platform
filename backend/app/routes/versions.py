from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.services import file_service
from pydantic import BaseModel
from datetime import datetime

router = APIRouter(prefix="/versions", tags=["versions"])


class FileVersionResponse(BaseModel):
    id: int
    file_id: int
    version_number: int
    file_size: int
    created_at: datetime

    class Config:
        from_attributes = True


@router.get("/file/{file_id}", response_model=List[FileVersionResponse])
def get_file_versions(
        file_id: int,
        db: Session = Depends(get_db),
        current_user: str = Depends(get_current_user)
):
    """Get all versions of a file"""
    return file_service.get_file_versions(db, file_id, current_user)


@router.post("/file/{file_id}/restore/{version_number}")
def restore_version(
        file_id: int,
        version_number: int,
        db: Session = Depends(get_db),
        current_user: str = Depends(get_current_user)
):
    """Restore a file to a previous version"""
    file = file_service.restore_file_version(db, file_id, version_number, current_user)
    return {
        "message": f"File restored to version {version_number}",
        "current_version": file.current_version
    }
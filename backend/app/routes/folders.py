from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List, Optional
from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.schemas.folder import FolderCreate, FolderUpdate, FolderResponse
from app.services import folder_service

router = APIRouter(prefix="/folders", tags=["folders"])

@router.post("/", response_model=FolderResponse)
def create_folder(
    folder: FolderCreate,
    db: Session = Depends(get_db),
    current_user: str = Depends(get_current_user)
):
    """Create a new folder"""
    return folder_service.create_folder(db, folder, current_user)

@router.get("/search", response_model=List[FolderResponse])
def search_folders(
    q: str,
    db: Session = Depends(get_db),
    current_user: str = Depends(get_current_user)
):
    """Search folders by name"""
    return folder_service.search_folders(db, current_user, q)

@router.get("/trash/all", response_model=List[FolderResponse])
def get_trashed_folders(
    db: Session = Depends(get_db),
    current_user: str = Depends(get_current_user)
):
    """Get all folders in trash"""
    return folder_service.get_trashed_folders(db, current_user)

@router.get("/", response_model=List[FolderResponse])
def get_folders(
    parent_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: str = Depends(get_current_user)
):
    """Get user's folders (optionally filtered by parent_id)"""
    return folder_service.get_user_folders(db, current_user, parent_id)

@router.put("/{folder_id}", response_model=FolderResponse)
def update_folder(
    folder_id: int,
    folder_update: FolderUpdate,
    db: Session = Depends(get_db),
    current_user: str = Depends(get_current_user)
):
    """Update folder name"""
    return folder_service.update_folder(db, folder_id, folder_update, current_user)

@router.post("/{folder_id}/restore", response_model=FolderResponse)
def restore_folder(
    folder_id: int,
    db: Session = Depends(get_db),
    current_user: str = Depends(get_current_user)
):
    """Restore a folder from trash"""
    return folder_service.restore_folder(db, folder_id, current_user)

@router.delete("/{folder_id}")
def delete_folder(
    folder_id: int,
    db: Session = Depends(get_db),
    current_user: str = Depends(get_current_user)
):
    """Move folder to trash (soft delete)"""
    return folder_service.delete_folder(db, folder_id, current_user)

@router.delete("/{folder_id}/permanent")
def permanently_delete_folder(
    folder_id: int,
    db: Session = Depends(get_db),
    current_user: str = Depends(get_current_user)
):
    """Permanently delete folder from database"""
    return folder_service.permanently_delete_folder(db, folder_id, current_user)
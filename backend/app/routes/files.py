from fastapi import APIRouter, Depends, UploadFile, File as FastAPIFile, Form
from sqlalchemy.orm import Session
from typing import List, Optional
from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.schemas.file import FileUploadResponse, FileResponse
from app.services import file_service

router = APIRouter(prefix="/files", tags=["files"])

@router.post("/upload", response_model=FileUploadResponse)
async def upload_file(
    file: UploadFile = FastAPIFile(...),
    folder_id: Optional[int] = Form(None),
    db: Session = Depends(get_db),
    current_user: str = Depends(get_current_user)
):
    """Upload a file"""
    return file_service.upload_file(db, file, current_user, folder_id)

# IMPORTANT: Specific routes MUST come before parametric routes
# Place all /files/specific-path routes BEFORE /files/{file_id}

@router.get("/search", response_model=List[FileUploadResponse])
def search_files(
    q: Optional[str] = None,
    file_type: Optional[str] = None,
    min_size: Optional[int] = None,
    max_size: Optional[int] = None,
    sort_by: Optional[str] = "created_at",
    sort_order: Optional[str] = "desc",
    db: Session = Depends(get_db),
    current_user: str = Depends(get_current_user)
):
    """Advanced search files with filters and sorting"""
    return file_service.search_files(
        db, current_user, q, file_type, min_size, max_size, sort_by, sort_order
    )

@router.get("/starred/all", response_model=List[FileUploadResponse])
def get_starred_files(
    db: Session = Depends(get_db),
    current_user: str = Depends(get_current_user)
):
    """Get all starred files"""
    return file_service.get_starred_files(db, current_user)

@router.get("/trash/all", response_model=List[FileUploadResponse])
def get_trashed_files(
    db: Session = Depends(get_db),
    current_user: str = Depends(get_current_user)
):
    """Get all files in trash"""
    return file_service.get_trashed_files(db, current_user)

# Parametric routes come AFTER all specific routes

@router.get("/", response_model=List[FileUploadResponse])
def get_files(
    folder_id: Optional[int] = None,
    sort_by: Optional[str] = "created_at",
    sort_order: Optional[str] = "desc",
    page: Optional[int] = 1,
    limit: Optional[int] = 50,
    db: Session = Depends(get_db),
    current_user: str = Depends(get_current_user)
):
    """Get user's files with sorting"""
    return file_service.get_user_files(db, current_user, folder_id, sort_by, sort_order, page, limit)

@router.get("/{file_id}")
def get_file(
    file_id: int,
    db: Session = Depends(get_db),
    current_user: str = Depends(get_current_user)
):
    """Get file with download URL"""
    return file_service.get_file_with_url(db, file_id, current_user)

@router.post("/{file_id}/star", response_model=FileUploadResponse)
def toggle_star_file(
    file_id: int,
    db: Session = Depends(get_db),
    current_user: str = Depends(get_current_user)
):
    """Toggle star status of a file"""
    return file_service.toggle_star(db, file_id, current_user)

@router.post("/{file_id}/restore", response_model=FileUploadResponse)
def restore_file(
    file_id: int,
    db: Session = Depends(get_db),
    current_user: str = Depends(get_current_user)
):
    """Restore a file from trash"""
    return file_service.restore_file(db, file_id, current_user)

@router.delete("/{file_id}")
def delete_file(
    file_id: int,
    db: Session = Depends(get_db),
    current_user: str = Depends(get_current_user)
):
    """Move file to trash"""
    return file_service.delete_file(db, file_id, current_user)

@router.delete("/{file_id}/permanent")
def permanently_delete_file(
    file_id: int,
    db: Session = Depends(get_db),
    current_user: str = Depends(get_current_user)
):
    """Permanently delete file"""
    return file_service.permanently_delete_file(db, file_id, current_user)

@router.get("/{file_id}/preview")
def get_file_preview(
    file_id: int,
    db: Session = Depends(get_db),
    current_user: str = Depends(get_current_user)
):
    """Get file preview data with access check"""
    from app.services import file_service
    return file_service.get_file_preview(db, file_id, current_user)
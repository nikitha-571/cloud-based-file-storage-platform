from fastapi import APIRouter, Depends, UploadFile, File as FastAPIFile, Form, Query, Header, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.schemas.file import FileUploadResponse, FileResponse
from app.services import file_service

router = APIRouter(prefix="/files", tags=["files"])


@router.get("/test-auth")
def test_auth(current_user: str = Depends(get_current_user)):
    """Test endpoint to verify authentication"""
    return {
        "authenticated": True,
        "user": current_user,
        "message": "Authentication working!"
    }


@router.post("/upload", response_model=FileUploadResponse)
def upload_file(
    file: UploadFile = FastAPIFile(...),
    folder_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: str = Depends(get_current_user)
):
    """Upload a file"""
    return file_service.upload_file(db, file, current_user, folder_id)

@router.post("/debug-upload")
async def debug_upload(
        file: UploadFile = FastAPIFile(...),
        folder_id: Optional[int] = Query(None),
        authorization: Optional[str] = Header(None),
        current_user: str = Depends(get_current_user)
):
    """Debug upload endpoint"""
    return {
        "received_folder_id": folder_id,
        "folder_id_type": str(type(folder_id)),
        "current_user": current_user,
        "filename": file.filename,
        "has_authorization_header": authorization is not None,
        "auth_header_preview": authorization[:50] if authorization else None
    }


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
        folder_id: Optional[int] = Query(None),
        sort_by: Optional[str] = "created_at",
        sort_order: Optional[str] = "desc",
        page: Optional[int] = 1,
        limit: Optional[int] = 50,
        db: Session = Depends(get_db),
        current_user: str = Depends(get_current_user)
):
    """Get user's files with sorting"""
    print(f"📂 GET FILES - folder_id: {folder_id}")
    print(f"📂 GET FILES - current_user: {current_user}")
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


@router.get("/folder/{folder_id}", response_model=List[FileResponse])
async def get_files_in_folder(
        folder_id: int,
        db: Session = Depends(get_db),
        current_user: str = Depends(get_current_user)
):
    """Get all files in a folder"""
    return file_service.get_files_in_folder(folder_id, db, current_user.id)
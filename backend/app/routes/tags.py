from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.schemas.tag import TagCreate, TagUpdate, TagResponse, FileTagUpdate
from app.schemas.file import FileUploadResponse
from app.services import tag_service

router = APIRouter(prefix="/tags", tags=["tags"])

@router.post("/", response_model=TagResponse)
def create_tag(
    tag_data: TagCreate,
    db: Session = Depends(get_db),
    current_user: str = Depends(get_current_user)
):
    return tag_service.create_tag(db, tag_data, current_user)

@router.get("/", response_model=List[TagResponse])
def get_tags(
    db: Session = Depends(get_db),
    current_user: str = Depends(get_current_user)
):
    return tag_service.get_user_tags(db, current_user)

@router.put("/{tag_id}", response_model=TagResponse)
def update_tag(
    tag_id: int,
    tag_data: TagUpdate,
    db: Session = Depends(get_db),
    current_user: str = Depends(get_current_user)
):
    return tag_service.update_tag(db, tag_id, tag_data, current_user)

@router.delete("/{tag_id}")
def delete_tag(
    tag_id: int,
    db: Session = Depends(get_db),
    current_user: str = Depends(get_current_user)
):
    return tag_service.delete_tag(db, tag_id, current_user)

@router.post("/file/{file_id}/tags")
def add_tags_to_file(
    file_id: int,
    tag_data: FileTagUpdate,
    db: Session = Depends(get_db),
    current_user: str = Depends(get_current_user)
):
    return tag_service.add_tags_to_file(db, file_id, tag_data.tag_ids, current_user)

@router.get("/{tag_id}/files", response_model=List[FileUploadResponse])
def get_files_by_tag(
    tag_id: int,
    db: Session = Depends(get_db),
    current_user: str = Depends(get_current_user)
):
    return tag_service.get_files_by_tag(db, tag_id, current_user)
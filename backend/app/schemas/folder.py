from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class FolderCreate(BaseModel):
    name: str
    parent_id: Optional[int] = None


class FolderUpdate(BaseModel):
    name: str


class FolderResponse(BaseModel):
    id: int
    name: str
    parent_id: Optional[int]
    owner_id: int
    is_deleted: bool
    created_at: datetime

    class Config:
        from_attributes = True
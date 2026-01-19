from pydantic import BaseModel
from datetime import datetime
from typing import List, Optional

class TagCreate(BaseModel):
    name: str
    color: Optional[str] = "#3B82F6"

class TagUpdate(BaseModel):
    name: Optional[str] = None
    color: Optional[str] = None

class TagResponse(BaseModel):
    id: int
    name: str
    color: str
    user_id: int
    created_at: datetime

    class Config:
        from_attributes = True

class FileTagUpdate(BaseModel):
    tag_ids: List[int]
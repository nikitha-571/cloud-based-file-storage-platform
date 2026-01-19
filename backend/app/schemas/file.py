from pydantic import BaseModel
from datetime import datetime
from typing import Optional,List

class TagInFile(BaseModel):
    id: int
    name: str
    color: str

    class Config:
        from_attributes = True
class FileUploadResponse(BaseModel):
    id: int
    name: str
    file_path: str
    file_size: int
    file_type: str
    folder_id: Optional[int]
    owner_id: int
    is_starred: bool
    is_deleted: bool
    created_at: datetime
    tags: List[TagInFile] = []

    class Config:
        from_attributes = True
class FileResponse(BaseModel):
    id: int
    name: str
    file_size: int
    file_type: str
    folder_id: Optional[int]
    is_starred: bool
    created_at: datetime
    download_url: Optional[str] = None
    tags: List[TagInFile] = []  #

    class Config:
        from_attributes = True
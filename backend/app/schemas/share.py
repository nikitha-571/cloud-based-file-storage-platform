from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional


class ShareCreate(BaseModel):
    file_id: Optional[int] = None
    folder_id: Optional[int] = None
    shared_with_email: EmailStr
    role: str


class ShareResponse(BaseModel):
    id: int
    file_id: Optional[int]
    folder_id: Optional[int]
    shared_with_email: str
    role: str
    created_at: datetime

    class Config:
        from_attributes = True


class PublicLinkCreate(BaseModel):
    file_id: int
    password: Optional[str] = None
    expires_in_days: Optional[int] = None  # Number of days until expiry


class PublicLinkResponse(BaseModel):
    id: int
    file_id: int
    token: str
    expires_at: Optional[datetime]
    is_active: bool
    created_at: datetime
    public_url: str

    class Config:
        from_attributes = True
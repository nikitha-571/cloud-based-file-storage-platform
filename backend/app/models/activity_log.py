from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.core.database import Base
import enum

class ActivityType(str, enum.Enum):
    UPLOAD = "upload"
    DELETE = "delete"
    RESTORE = "restore"
    SHARE = "share"
    UNSHARE = "unshare"
    RENAME = "rename"
    MOVE = "move"
    DOWNLOAD = "download"
    VERSION_UPLOAD = "version_upload"
    VERSION_RESTORE = "version_restore"

class ActivityLog(Base):
    __tablename__ = "activity_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    activity_type = Column(String, nullable=False)  # upload, delete, share, etc.
    resource_type = Column(String, nullable=False)  # file, folder
    resource_id = Column(Integer, nullable=False)  # ID of file/folder
    resource_name = Column(String, nullable=False)  # Name at time of action
    details = Column(Text, nullable=True)  # JSON or text details
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    user = relationship("User")
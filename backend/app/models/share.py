from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Enum
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.core.database import Base
import enum


class ShareRole(str, enum.Enum):
    VIEWER = "viewer"
    EDITOR = "editor"


class Share(Base):
    __tablename__ = "shares"

    id = Column(Integer, primary_key=True, index=True)
    file_id = Column(Integer, ForeignKey("files.id"), nullable=True)
    folder_id = Column(Integer, ForeignKey("folders.id"), nullable=True)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    shared_with_email = Column(String, nullable=False)
    role = Column(Enum(ShareRole), nullable=False, default=ShareRole.VIEWER)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    file = relationship("File", backref="shares")
    folder = relationship("Folder", backref="shares")
    owner = relationship("User", backref="shares")
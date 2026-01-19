from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Boolean, BigInteger
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.models.tag import file_tags


class File(Base):
    __tablename__ = "files"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    file_path = Column(String, nullable=False)  # Path in Supabase Storage
    file_size = Column(BigInteger, nullable=False)  # Size in bytes
    file_type = Column(String, nullable=False)  # MIME type (e.g., image/png)
    folder_id = Column(Integer, ForeignKey("folders.id"), nullable=True)  # Can be in root
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    is_starred = Column(Boolean, default=False)
    is_deleted = Column(Boolean, default=False)  # For trash
    current_version = Column(Integer, default=1)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())


    # Relationships
    owner = relationship("User", back_populates="files")
    folder = relationship("Folder", backref="files")
    versions = relationship("FileVersion", back_populates="file", cascade="all, delete-orphan")  #
    tags = relationship("Tag", secondary=file_tags, back_populates="files")
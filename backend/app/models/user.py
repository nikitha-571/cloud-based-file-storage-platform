from sqlalchemy import Column, Integer, String, DateTime, Boolean
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.core.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String)
    is_active = Column(Boolean, default=True)

    # ← OAUTH FIELDS
    oauth_provider = Column(String, nullable=True)  # 'google', 'github', etc.
    oauth_id = Column(String, nullable=True, unique=True)  # Provider's user ID
    profile_picture = Column(String, nullable=True)  # Profile picture URL

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    folders = relationship("Folder", back_populates="owner")
    files = relationship("File", back_populates="owner")
    tags = relationship("Tag", back_populates="user")
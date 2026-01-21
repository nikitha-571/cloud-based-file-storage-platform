from sqlalchemy.orm import Session
from typing import List
from fastapi import HTTPException
from app.models.tag import Tag
from app.models.file import File
from app.models.user import User
from app.schemas.tag import TagCreate, TagUpdate


def create_tag(db: Session, tag_data: TagCreate, user_email: str):
    """Create a new tag"""
    user = db.query(User).filter(User.email == user_email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    existing_tag = db.query(Tag).filter(
        Tag.name == tag_data.name,
        Tag.user_id == user.id
    ).first()

    if existing_tag:
        raise HTTPException(status_code=400, detail="Tag already exists")

    tag = Tag(
        name=tag_data.name,
        color=tag_data.color,
        user_id=user.id
    )

    db.add(tag)
    db.commit()
    db.refresh(tag)
    return tag


def get_user_tags(db: Session, user_email: str) -> List[Tag]:
    """Get all tags for a user"""
    user = db.query(User).filter(User.email == user_email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return db.query(Tag).filter(Tag.user_id == user.id).all()

def update_tag(db: Session, tag_id: int, tag_data: TagUpdate, user_email: str):
    user = db.query(User).filter(User.email == user_email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    tag = db.query(Tag).filter(
        Tag.id == tag_id,
        Tag.user_id == user.id
    ).first()

    if not tag:
        raise HTTPException(status_code=404, detail="Tag not found")

    if tag_data.name:
        tag.name = tag_data.name
    if tag_data.color:
        tag.color = tag_data.color

    db.commit()
    db.refresh(tag)
    return tag

def delete_tag(db: Session, tag_id: int, user_email: str):
    user = db.query(User).filter(User.email == user_email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    tag = db.query(Tag).filter(
        Tag.id == tag_id,
        Tag.user_id == user.id
    ).first()

    if not tag:
        raise HTTPException(status_code=404, detail="Tag not found")

    db.delete(tag)
    db.commit()
    return {"message": "Tag deleted"}

def add_tags_to_file(db: Session, file_id: int, tag_ids: List[int], user_email: str):
    """Add tags to a file"""
    user = db.query(User).filter(User.email == user_email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    file = db.query(File).filter(
        File.id == file_id,
        File.owner_id == user.id
    ).first()

    if not file:
        raise HTTPException(status_code=404, detail="File not found")

    tags = db.query(Tag).filter(
        Tag.id.in_(tag_ids),
        Tag.user_id == user.id
    ).all()

    file.tags = tags
    db.commit()
    db.refresh(file)

    return file
def get_files_by_tag(db: Session, tag_id: int, user_email: str):

    user = db.query(User).filter(User.email == user_email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    tag = db.query(Tag).filter(
        Tag.id == tag_id,
        Tag.user_id == user.id
    ).first()

    if not tag:
        raise HTTPException(status_code=404, detail="Tag not found")

    return tag.files
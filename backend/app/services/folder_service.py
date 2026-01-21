from sqlalchemy.orm import Session
from typing import Optional
from app.models.folder import Folder
from app.models.user import User
from app.schemas.folder import FolderCreate, FolderUpdate
from fastapi import HTTPException


def create_folder(db: Session, folder: FolderCreate, user_email: str):

    user = db.query(User).filter(User.email == user_email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")


    if folder.parent_id:
        parent = db.query(Folder).filter(
            Folder.id == folder.parent_id,
            Folder.owner_id == user.id
        ).first()
        if not parent:
            raise HTTPException(status_code=404, detail="Parent folder not found")

    # Create folder
    db_folder = Folder(
        name=folder.name,
        parent_id=folder.parent_id,
        owner_id=user.id
    )
    db.add(db_folder)
    db.commit()
    db.refresh(db_folder)
    return db_folder


def get_user_folders(db: Session, user_email: str, parent_id: Optional[int] = None):

    user = db.query(User).filter(User.email == user_email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    query = db.query(Folder).filter(
        Folder.owner_id == user.id,
        Folder.is_deleted == False
    )

    if parent_id is None:

        query = query.filter(Folder.parent_id == None)
    else:

        query = query.filter(Folder.parent_id == parent_id)

    return query.all()


def update_folder(db: Session, folder_id: int, folder_update: FolderUpdate, user_email: str):
    # Get user
    user = db.query(User).filter(User.email == user_email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Get folder
    db_folder = db.query(Folder).filter(
        Folder.id == folder_id,
        Folder.owner_id == user.id
    ).first()

    if not db_folder:
        raise HTTPException(status_code=404, detail="Folder not found")

    # Update folder
    db_folder.name = folder_update.name
    db.commit()
    db.refresh(db_folder)
    return db_folder


def delete_folder(db: Session, folder_id: int, user_email: str):
    # Get user
    user = db.query(User).filter(User.email == user_email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Get folder
    db_folder = db.query(Folder).filter(
        Folder.id == folder_id,
        Folder.owner_id == user.id
    ).first()

    if not db_folder:
        raise HTTPException(status_code=404, detail="Folder not found")

    folder_name = db_folder.name
    db_folder.is_deleted = True
    from app.services import activity_service
    activity_service.log_activity(
        db=db,
        user_email=user_email,
        activity_type="delete",
        resource_type="folder",
        resource_id=db_folder.id,
        resource_name=folder_name,
        details={}
    )

    db.commit()
    return {"message": "Folder moved to trash"}


def get_trashed_folders(db: Session, user_email: str):

    user = db.query(User).filter(User.email == user_email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")


    return db.query(Folder).filter(
        Folder.owner_id == user.id,
        Folder.is_deleted == True
    ).all()


def restore_folder(db: Session, folder_id: int, user_email: str):
    """Restore a folder from trash"""


    user = db.query(User).filter(User.email == user_email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")


    folder = db.query(Folder).filter(
        Folder.id == folder_id,
        Folder.owner_id == user.id
    ).first()

    if not folder:
        raise HTTPException(status_code=404, detail="Folder not found")


    if not folder.is_deleted:
        raise HTTPException(status_code=400, detail="Folder is not in trash")

    # Restore
    folder.is_deleted = False
    db.commit()
    db.refresh(folder)

    return folder

def search_folders(db: Session, user_email: str, query: str):
    """Search folders by name"""

    user = db.query(User).filter(User.email == user_email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return db.query(Folder).filter(
        Folder.owner_id == user.id,
        Folder.is_deleted == False,
        Folder.name.ilike(f"%{query}%")
    ).all()


def permanently_delete_folder(db: Session, folder_id: int, user_email: str):
    """Permanently delete a folder from database"""


    user = db.query(User).filter(User.email == user_email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    folder = db.query(Folder).filter(
        Folder.id == folder_id,
        Folder.owner_id == user.id
    ).first()

    if not folder:
        raise HTTPException(status_code=404, detail="Folder not found")

    if not folder.is_deleted:
        raise HTTPException(
            status_code=400,
            detail="Folder must be in trash before permanent deletion"
        )

    db.delete(folder)
    db.commit()

    return {"message": "Folder permanently deleted"}


def get_folder_path(db: Session, folder_id: int, user_email: str):
    """Get the complete path from root to this folder"""
    user = db.query(User).filter(User.email == user_email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    folder = db.query(Folder).filter(
        Folder.id == folder_id,
        Folder.owner_id == user.id
    ).first()

    if not folder:
        raise HTTPException(status_code=404, detail="Folder not found")

    path = []
    current = folder

    while current:
        path.insert(0, {
            "id": current.id,
            "name": current.name
        })

        if current.parent_id:
            current = db.query(Folder).filter(
                Folder.id == current.parent_id,
                Folder.owner_id == user.id
            ).first()
        else:
            current = None

    return path
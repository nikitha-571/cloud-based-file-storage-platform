from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timedelta
from fastapi import HTTPException
from app.models.share import Share, ShareRole
from app.models.public_link import PublicLink
from app.models.file import File
from app.models.folder import Folder
from app.models.user import User
from app.schemas.share import ShareCreate, PublicLinkCreate
from app.core.config import settings


def create_share(db: Session, share_data: ShareCreate, user_email: str):
    """Share a file or folder with another user"""

    owner = db.query(User).filter(User.email == user_email).first()
    if not owner:
        raise HTTPException(status_code=404, detail="User not found")

    if not share_data.file_id and not share_data.folder_id:
        raise HTTPException(status_code=400, detail="Either file_id or folder_id must be provided")

    if share_data.file_id:
        file = db.query(File).filter(
            File.id == share_data.file_id,
            File.owner_id == owner.id
        ).first()
        if not file:
            raise HTTPException(status_code=404, detail="File not found or you don't own it")

    if share_data.folder_id:
        folder = db.query(Folder).filter(
            Folder.id == share_data.folder_id,
            Folder.owner_id == owner.id
        ).first()
        if not folder:
            raise HTTPException(status_code=404, detail="Folder not found or you don't own it")

    existing_share = db.query(Share).filter(
        Share.file_id == share_data.file_id,
        Share.folder_id == share_data.folder_id,
        Share.shared_with_email == share_data.shared_with_email
    ).first()

    if existing_share:
        raise HTTPException(status_code=400, detail="Already shared with this user")

    db_share = Share(
        file_id=share_data.file_id,
        folder_id=share_data.folder_id,
        owner_id=owner.id,
        shared_with_email=share_data.shared_with_email,
        role=ShareRole.VIEWER if share_data.role == "viewer" else ShareRole.EDITOR
    )

    db.add(db_share)
    db.commit()
    db.refresh(db_share)

    return db_share


def get_shared_with_me(db: Session, user_email: str):

    shares = db.query(Share).filter(
        Share.shared_with_email == user_email
    ).all()

    result = []
    for share in shares:
        if share.file_id:
            file = db.query(File).filter(File.id == share.file_id).first()
            if file and not file.is_deleted:
                result.append({
                    "type": "file",
                    "item": file,
                    "share": share
                })
        elif share.folder_id:
            folder = db.query(Folder).filter(Folder.id == share.folder_id).first()
            if folder and not folder.is_deleted:
                result.append({
                    "type": "folder",
                    "item": folder,
                    "share": share
                })

    return result


def get_shares_by_owner(db: Session, user_email: str):
    """Get all shares created by the current user"""

    owner = db.query(User).filter(User.email == user_email).first()
    if not owner:
        raise HTTPException(status_code=404, detail="User not found")

    return db.query(Share).filter(Share.owner_id == owner.id).all()


def delete_share(db: Session, share_id: int, user_email: str):
    """Remove a share"""

    owner = db.query(User).filter(User.email == user_email).first()
    if not owner:
        raise HTTPException(status_code=404, detail="User not found")

    share = db.query(Share).filter(
        Share.id == share_id,
        Share.owner_id == owner.id
    ).first()

    if not share:
        raise HTTPException(status_code=404, detail="Share not found")

    db.delete(share)
    db.commit()

    return {"message": "Share removed"}


def create_public_link(db: Session, link_data: PublicLinkCreate, user_email: str):
    """Create a public shareable link for a file"""

    owner = db.query(User).filter(User.email == user_email).first()
    if not owner:
        raise HTTPException(status_code=404, detail="User not found")

    file = db.query(File).filter(
        File.id == link_data.file_id,
        File.owner_id == owner.id
    ).first()

    if not file:
        raise HTTPException(status_code=404, detail="File not found or you don't own it")

    expires_at = None
    if link_data.expires_in_days:
        from datetime import timezone
        expires_at = datetime.now(timezone.utc) + timedelta(days=link_data.expires_in_days)

    public_link = PublicLink(
        file_id=link_data.file_id,
        password=link_data.password,
        expires_at=expires_at
    )

    db.add(public_link)
    db.commit()
    db.refresh(public_link)

    return public_link


def get_public_links(db: Session, user_email: str):
    """Get all public links created by the user"""

    owner = db.query(User).filter(User.email == user_email).first()
    if not owner:
        raise HTTPException(status_code=404, detail="User not found")

    links = db.query(PublicLink).join(File).filter(
        File.owner_id == owner.id,
        PublicLink.is_active == True
    ).all()

    return links


def access_public_link(db: Session, token: str, password: Optional[str] = None):
    """Access a file via public link"""

    link = db.query(PublicLink).filter(
        PublicLink.token == token,
        PublicLink.is_active == True
    ).first()

    if not link:
        raise HTTPException(status_code=404, detail="Link not found or expired")

    if link.expires_at:
        from datetime import timezone
        current_time = datetime.now(timezone.utc)
        expires_at = link.expires_at
        if expires_at.tzinfo is None:

            expires_at = expires_at.replace(tzinfo=timezone.utc)

        if expires_at < current_time:
            raise HTTPException(status_code=403, detail="Link has expired")

    if link.password and link.password != password:
        raise HTTPException(status_code=403, detail="Incorrect password")

    file = db.query(File).filter(File.id == link.file_id).first()

    return file


def delete_public_link(db: Session, link_id: int, user_email: str):
    """Delete a public link"""

    owner = db.query(User).filter(User.email == user_email).first()
    if not owner:
        raise HTTPException(status_code=404, detail="User not found")

    link = db.query(PublicLink).join(File).filter(
        PublicLink.id == link_id,
        File.owner_id == owner.id
    ).first()

    if not link:
        raise HTTPException(status_code=404, detail="Link not found")

    link.is_active = False
    db.commit()

    return {"message": "Public link deleted"}
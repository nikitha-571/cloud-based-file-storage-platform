from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List, Optional
from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.schemas.share import ShareCreate, ShareResponse, PublicLinkCreate, PublicLinkResponse
from app.services import share_service
from app.core.config import settings

router = APIRouter(prefix="/shares", tags=["shares"])


@router.post("/", response_model=ShareResponse)
def create_share(
        share_data: ShareCreate,
        db: Session = Depends(get_db),
        current_user: str = Depends(get_current_user)
):
    """Share a file or folder with another user"""
    return share_service.create_share(db, share_data, current_user)


@router.get("/shared-with-me")
def get_shared_with_me(
        db: Session = Depends(get_db),
        current_user: str = Depends(get_current_user)
):
    """Get all files/folders shared with me"""
    return share_service.get_shared_with_me(db, current_user)


@router.get("/my-shares", response_model=List[ShareResponse])
def get_my_shares(
        db: Session = Depends(get_db),
        current_user: str = Depends(get_current_user)
):
    """Get all shares I've created"""
    return share_service.get_shares_by_owner(db, current_user)


@router.delete("/{share_id}")
def delete_share(
        share_id: int,
        db: Session = Depends(get_db),
        current_user: str = Depends(get_current_user)
):
    """Remove a share"""
    return share_service.delete_share(db, share_id, current_user)


@router.post("/public-link")
def create_public_link(
        link_data: PublicLinkCreate,
        db: Session = Depends(get_db),
        current_user: str = Depends(get_current_user)
):
    """Create a public shareable link"""
    link = share_service.create_public_link(db, link_data, current_user)

    # Build public URL
    public_url = f"http://localhost:5173/public/{link.token}"

    return {
        **link.__dict__,
        "public_url": public_url
    }


@router.get("/public-links")
def get_public_links(
        db: Session = Depends(get_db),
        current_user: str = Depends(get_current_user)
):
    """Get all my public links"""
    links = share_service.get_public_links(db, current_user)

    result = []
    for link in links:
        result.append({
            **link.__dict__,
            "public_url": f"http://localhost:5173/public/{link.token}"
        })

    return result


@router.get("/public/{token}")
def access_public_link(
        token: str,
        password: Optional[str] = None,
        db: Session = Depends(get_db)
):
    """Access a file via public link (no auth required)"""
    file = share_service.access_public_link(db, token, password)

    # Get download URL
    from app.services.storage_service import get_file_url
    download_url = get_file_url(file.file_path)

    return {
        "id": file.id,
        "name": file.name,
        "file_size": file.file_size,
        "file_type": file.file_type,
        "download_url": download_url
    }


@router.delete("/public-link/{link_id}")
def delete_public_link(
        link_id: int,
        db: Session = Depends(get_db),
        current_user: str = Depends(get_current_user)
):
    """Delete a public link"""
    return share_service.delete_public_link(db, link_id, current_user)
from sqlalchemy.orm import Session, joinedload
from typing import Optional, List
from fastapi import UploadFile, HTTPException
from app.models.file import File
from app.models.user import User
from app.models.folder import Folder
from app.services.storage_service import upload_file_to_storage, get_file_url, delete_file_from_storage
from app.models.file_version import FileVersion
from app.services import activity_service
import re


def get_base_filename(filename: str) -> str:

    if '.' in filename:
        name, ext = filename.rsplit('.', 1)
        name = re.sub(r'\s*\(\d+\)\s*$', '', name)
        return f"{name}.{ext}"
    else:
        return re.sub(r'\s*\(\d+\)\s*$', '', filename)


def get_next_version_filename(base_filename: str, version_number: int) -> str:

    if version_number == 1:
        return base_filename

    if '.' in base_filename:
        name, ext = base_filename.rsplit('.', 1)
        return f"{name}({version_number - 1}).{ext}"
    else:
        return f"{base_filename}({version_number - 1})"

def upload_file(
        db: Session,
        file: UploadFile,
        user_email: str,
        folder_id: Optional[int] = None
):
    user = db.query(User).filter(User.email == user_email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")


    if folder_id:
        folder = db.query(Folder).filter(
            Folder.id == folder_id,
            Folder.owner_id == user.id
        ).first()
        if not folder:
            raise HTTPException(status_code=404, detail="Folder not found")
        print(f"✅ Validated folder_id: {folder_id} - Folder name: {folder.name}")
    else:
        print(f"📂 No folder_id provided - uploading to root")

    if not file.filename:
        raise HTTPException(status_code=400, detail="No filename provided")

    MAX_FILE_SIZE = 500 * 1024 * 1024

    try:
        file.file.seek(0, 2)
        file_size = file.file.tell()
        file.file.seek(0)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Cannot read file: {str(e)}")

    if file_size > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=400,
            detail=f"File too large. Maximum size is {MAX_FILE_SIZE / (1024 * 1024):.0f}MB"
        )
    if file_size == 0:
        raise HTTPException(status_code=400, detail="Cannot upload empty file")

    try:

        base_filename = get_base_filename(file.filename)

        print(f"📤 Uploading: {file.filename}")
        print(f"🔍 Base filename: {base_filename}")
        print(f"📁 Target folder_id: {folder_id}")


        query_filter = [
            File.owner_id == user.id,
            File.is_deleted == False
        ]


        if folder_id is None:
            query_filter.append(File.folder_id == None)
        else:
            query_filter.append(File.folder_id == folder_id)

        existing_files = db.query(File).filter(*query_filter).all()

        print(f"🔎 Found {len(existing_files)} existing files in this location")


        original_file = None
        max_version = 0

        for existing in existing_files:
            if get_base_filename(existing.name) == base_filename:

                if existing.current_version > max_version:
                    max_version = existing.current_version
                    original_file = existing
                print(f"📌 Found matching file: {existing.name} (version {existing.current_version})")

        if original_file:

            new_version_number = max_version + 1
            new_filename = get_next_version_filename(base_filename, new_version_number)

            print(f"📝 Found existing file series. Creating version {new_version_number}: {new_filename}")
            print(f"📁 Will be created in folder_id: {folder_id}")

            storage_data = upload_file_to_storage(file, user_email)


            new_file = File(
                name=new_filename,
                file_path=storage_data["file_path"],
                file_size=storage_data["file_size"],
                file_type=storage_data["file_type"],
                folder_id=folder_id,
                owner_id=user.id,
                current_version=new_version_number
            )

            db.add(new_file)
            db.flush()

            print(f"✅ Created file with folder_id: {new_file.folder_id}")


            new_version = FileVersion(
                file_id=original_file.id,
                version_number=new_version_number,
                file_path=storage_data["file_path"],
                file_size=storage_data["file_size"],
                uploaded_by=user.id
            )
            db.add(new_version)

            # Log activity
            activity_service.log_activity(
                db=db,
                user_email=user_email,
                activity_type="version_upload",
                resource_type="file",
                resource_id=new_file.id,
                resource_name=new_file.name,
                details={
                    "version_number": new_version_number,
                    "file_size": storage_data["file_size"],
                    "file_type": storage_data["file_type"],
                    "base_filename": base_filename,
                    "folder_id": folder_id
                }
            )

            db.commit()
            db.refresh(new_file)

            print(f"✅ Created {new_filename} as version {new_version_number} in folder {folder_id}")
            return new_file

        else:

            print(f"🆕 Creating new file: {base_filename} (Version 1)")
            print(f"📁 Will be created in folder_id: {folder_id}")

            storage_data = upload_file_to_storage(file, user_email)


            db_file = File(
                name=base_filename,
                file_path=storage_data["file_path"],
                file_size=storage_data["file_size"],
                file_type=storage_data["file_type"],
                folder_id=folder_id,
                owner_id=user.id,
                current_version=1
            )

            db.add(db_file)
            db.flush()

            print(f"✅ Created file with folder_id: {db_file.folder_id}")

            # Create first version entry
            first_version = FileVersion(
                file_id=db_file.id,
                version_number=1,
                file_path=storage_data["file_path"],
                file_size=storage_data["file_size"],
                uploaded_by=user.id
            )
            db.add(first_version)

            # Log activity
            activity_service.log_activity(
                db=db,
                user_email=user_email,
                activity_type="upload",
                resource_type="file",
                resource_id=db_file.id,
                resource_name=db_file.name,
                details={
                    "file_size": db_file.file_size,
                    "file_type": db_file.file_type,
                    "folder_id": folder_id
                }
            )

            db.commit()
            db.refresh(db_file)

            print(f"✅ Created {base_filename} (Version 1) in folder {folder_id}")
            return db_file

    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        import traceback
        print(f"❌ Upload error: {str(e)}")
        print(traceback.format_exc())
        raise HTTPException(
            status_code=500,
            detail=f"Upload failed: {str(e)}"
        )
def get_file_versions(db: Session, file_id: int, user_email: str):
    """Get all versions of a file"""
    user = db.query(User).filter(User.email == user_email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    file = db.query(File).filter(
        File.id == file_id,
        File.owner_id == user.id
    ).first()

    if not file:
        raise HTTPException(status_code=404, detail="File not found")


    base_filename = get_base_filename(file.name)

    original_file = db.query(File).filter(
        File.owner_id == user.id,
        File.folder_id == file.folder_id,
        File.name == base_filename,
        File.is_deleted == False
    ).first()

    if not original_file:

        original_file = file

    versions = db.query(FileVersion).filter(
        FileVersion.file_id == original_file.id
    ).order_by(FileVersion.version_number.desc()).all()

    return versions


def restore_file_version(db: Session, file_id: int, version_number: int, user_email: str):

    user = db.query(User).filter(User.email == user_email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    file = db.query(File).filter(
        File.id == file_id,
        File.owner_id == user.id
    ).first()

    if not file:
        raise HTTPException(status_code=404, detail="File not found")

    base_filename = get_base_filename(file.name)
    original_file = db.query(File).filter(
        File.owner_id == user.id,
        File.folder_id == file.folder_id,
        File.name == base_filename,
        File.is_deleted == False
    ).first()

    if not original_file:
        original_file = file


    version = db.query(FileVersion).filter(
        FileVersion.file_id == original_file.id,
        FileVersion.version_number == version_number
    ).first()

    if not version:
        raise HTTPException(status_code=404, detail="Version not found")


    max_version = db.query(FileVersion).filter(
        FileVersion.file_id == original_file.id
    ).count()

    new_version_number = max_version + 1
    new_filename = get_next_version_filename(base_filename, new_version_number)


    new_file = File(
        name=new_filename,
        file_path=version.file_path,
        file_size=version.file_size,
        file_type=file.file_type,
        folder_id=file.folder_id,
        owner_id=user.id,
        current_version=new_version_number
    )

    db.add(new_file)
    db.flush()


    new_version = FileVersion(
        file_id=original_file.id,
        version_number=new_version_number,
        file_path=version.file_path,
        file_size=version.file_size,
        uploaded_by=user.id
    )
    db.add(new_version)

    # Log activity
    activity_service.log_activity(
        db=db,
        user_email=user_email,
        activity_type="version_restore",
        resource_type="file",
        resource_id=new_file.id,
        resource_name=new_file.name,
        details={
            "restored_from_version": version_number,
            "new_version": new_version_number,
            "new_filename": new_filename
        }
    )

    db.commit()
    db.refresh(new_file)

    return new_file


def get_user_files(
        db: Session,
        user_email: str,
        folder_id: Optional[int] = None,
        sort_by: Optional[str] = "created_at",
        sort_order: Optional[str] = "desc",
        page: int = 1,
        limit: int = 50
) -> List[File]:

    user = db.query(User).filter(User.email == user_email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    query = db.query(File).filter(
        File.owner_id == user.id,
        File.is_deleted == False
    )

    if folder_id is None:
        query = query.filter(File.folder_id == None)
    else:
        query = query.filter(File.folder_id == folder_id)

    # Apply sorting
    if sort_by == "name":
        query = query.order_by(
            File.name.desc() if sort_order == "desc" else File.name.asc()
        )
    elif sort_by == "size":
        query = query.order_by(
            File.file_size.desc() if sort_order == "desc" else File.file_size.asc()
        )
    elif sort_by == "type":
        query = query.order_by(
            File.file_type.desc() if sort_order == "desc" else File.file_type.asc()
        )
    else:
        query = query.order_by(
            File.created_at.desc() if sort_order == "desc" else File.created_at.asc()
        )


    offset = (page - 1) * limit
    query = query.offset(offset).limit(limit)

    return query.all()


def get_file_with_url(db: Session, file_id: int, user_email: str):
    user = db.query(User).filter(User.email == user_email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    file = db.query(File).filter(
        File.id == file_id,
        File.owner_id == user.id
    ).first()

    if not file:
        raise HTTPException(status_code=404, detail="File not found")

    download_url = get_file_url(file.file_path)

    return {
        **file.__dict__,
        "download_url": download_url
    }


def get_file_preview(db: Session, file_id: int, user_email: str):
    """Get file with preview URL and metadata"""
    user = db.query(User).filter(User.email == user_email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    file = db.query(File).filter(
        File.id == file_id,
        File.owner_id == user.id
    ).first()

    if not file:
        raise HTTPException(status_code=404, detail="File not found")

    preview_url = get_file_url(file.file_path)

    previewable_types = [
        'image/', 'application/pdf', 'text/',
        'video/', 'audio/', 'application/json',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/msword'
    ]
    is_previewable = any(file.file_type.startswith(t) for t in previewable_types)

    return {
        "id": file.id,
        "name": file.name,
        "file_size": file.file_size,
        "file_type": file.file_type,
        "preview_url": preview_url,
        "is_previewable": is_previewable,
        "created_at": file.created_at,
        "is_starred": file.is_starred,
        "current_version": file.current_version
    }


def delete_file(db: Session, file_id: int, user_email: str):
    """Soft delete a file (move to trash)"""
    user = db.query(User).filter(User.email == user_email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    file = db.query(File).filter(
        File.id == file_id,
        File.owner_id == user.id
    ).first()

    if not file:
        raise HTTPException(status_code=404, detail="File not found")

    file_name = file.name
    file_size = file.file_size
    file.is_deleted = True

    activity_service.log_activity(
        db=db,
        user_email=user_email,
        activity_type="delete",
        resource_type="file",
        resource_id=file.id,
        resource_name=file_name,
        details={
            "file_size": file_size,
            "file_type": file.file_type
        }
    )

    db.commit()
    return {"message": "File moved to trash"}


def permanently_delete_file(db: Session, file_id: int, user_email: str):
    """Permanently delete a file from storage and database"""
    user = db.query(User).filter(User.email == user_email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    file = db.query(File).filter(
        File.id == file_id,
        File.owner_id == user.id
    ).first()

    if not file:
        raise HTTPException(status_code=404, detail="File not found")

    try:
        delete_file_from_storage(file.file_path)
    except Exception as e:
        print(f"Warning: Could not delete file from storage: {e}")

    # Delete from database
    db.delete(file)
    db.commit()

    return {"message": "File permanently deleted"}


def toggle_star(db: Session, file_id: int, user_email: str):
    """Toggle starred status of a file"""
    user = db.query(User).filter(User.email == user_email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    file = db.query(File).filter(
        File.id == file_id,
        File.owner_id == user.id
    ).first()

    if not file:
        raise HTTPException(status_code=404, detail="File not found")

    file.is_starred = not file.is_starred
    db.commit()
    db.refresh(file)

    return file


def get_starred_files(db: Session, user_email: str) -> List[File]:
    """Get all starred files for a user"""
    user = db.query(User).filter(User.email == user_email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return db.query(File).filter(
        File.owner_id == user.id,
        File.is_starred == True,
        File.is_deleted == False
    ).all()


def get_trashed_files(db: Session, user_email: str) -> List[File]:
    """Get all deleted files for a user"""
    user = db.query(User).filter(User.email == user_email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return db.query(File).filter(
        File.owner_id == user.id,
        File.is_deleted == True
    ).all()


def restore_file(db: Session, file_id: int, user_email: str):
    """Restore a file from trash"""
    user = db.query(User).filter(User.email == user_email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    file = db.query(File).filter(
        File.id == file_id,
        File.owner_id == user.id
    ).first()

    if not file:
        raise HTTPException(status_code=404, detail="File not found")

    if not file.is_deleted:
        raise HTTPException(status_code=400, detail="File is not in trash")

    file.is_deleted = False
    db.commit()
    db.refresh(file)

    return file


def search_files(
        db: Session,
        user_email: str,
        query: Optional[str] = None,
        file_type: Optional[str] = None,
        min_size: Optional[int] = None,
        max_size: Optional[int] = None,
        sort_by: Optional[str] = "created_at",
        sort_order: Optional[str] = "desc"
) -> List[File]:
    """Advanced search files with filters and sorting"""
    user = db.query(User).filter(User.email == user_email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    files_query = db.query(File).filter(
        File.owner_id == user.id,
        File.is_deleted == False
    )

    # Apply filters
    if query:
        files_query = files_query.filter(File.name.ilike(f"%{query}%"))
    if file_type:
        files_query = files_query.filter(File.file_type.ilike(f"%{file_type}%"))
    if min_size is not None:
        files_query = files_query.filter(File.file_size >= min_size)
    if max_size is not None:
        files_query = files_query.filter(File.file_size <= max_size)

    # Apply sorting
    if sort_by == "name":
        files_query = files_query.order_by(
            File.name.desc() if sort_order == "desc" else File.name.asc()
        )
    elif sort_by == "size":
        files_query = files_query.order_by(
            File.file_size.desc() if sort_order == "desc" else File.file_size.asc()
        )
    elif sort_by == "type":
        files_query = files_query.order_by(
            File.file_type.desc() if sort_order == "desc" else File.file_type.asc()
        )
    else:
        files_query = files_query.order_by(
            File.created_at.desc() if sort_order == "desc" else File.created_at.asc()
        )

    return files_query.all()
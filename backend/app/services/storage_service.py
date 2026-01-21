from supabase import create_client
from app.core.config import settings
import uuid
from fastapi import UploadFile, HTTPException
import traceback



supabase = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)


def upload_file_to_storage(file: UploadFile, user_email: str) -> dict:

    try:

        file_extension = file.filename.split('.')[-1] if '.' in file.filename else ''
        unique_filename = f"{user_email}/{uuid.uuid4()}.{file_extension}"

        # Read file content
        print(f"📤 Starting upload: {file.filename}")
        print(f"📦 Content type: {file.content_type}")

        file_content = file.file.read()
        file_size = len(file_content)

        print(f"📊 File size: {file_size} bytes ({file_size / (1024 * 1024):.2f} MB)")

        if file_size == 0:
            raise HTTPException(status_code=400, detail="Cannot upload empty file")

        content_type = file.content_type if file.content_type else "application/octet-stream"
        print(f"☁️  Uploading to Supabase: {unique_filename}")

        response = supabase.storage.from_('user-files').upload(
            path=unique_filename,
            file=file_content,
            file_options={
                "content-type": content_type,
                "upsert": "false"
            }
        )

        print(f"✅ Upload successful: {response}")

        return {
            "file_path": unique_filename,
            "file_size": file_size,
            "file_type": content_type,
            "original_name": file.filename
        }

    except HTTPException:
        raise
    except Exception as e:
        error_msg = str(e)
        print(f"❌ Upload error: {error_msg}")
        print(f"📋 Traceback:\n{traceback.format_exc()}")

        if "already exists" in error_msg.lower():
            raise HTTPException(status_code=409, detail="File already exists in storage")
        elif "size" in error_msg.lower():
            raise HTTPException(status_code=413, detail="File too large")
        elif "bucket" in error_msg.lower():
            raise HTTPException(status_code=500, detail="Storage bucket not configured properly")
        else:
            raise HTTPException(status_code=500, detail=f"File upload failed: {error_msg}")


def get_file_url(file_path: str) -> str:
    try:
        response = supabase.storage.from_('user-files').create_signed_url(
            path=file_path,
            expires_in=3600  # 1 hour
        )
        return response['signedURL']
    except Exception as e:
        print(f"❌ Get URL error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get file URL: {str(e)}")

def delete_file_from_storage(file_path: str):
    try:
        supabase.storage.from_('user-files').remove([file_path])
        print(f"🗑️  Deleted from storage: {file_path}")
    except Exception as e:
        print(f"❌ Delete error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to delete file: {str(e)}")
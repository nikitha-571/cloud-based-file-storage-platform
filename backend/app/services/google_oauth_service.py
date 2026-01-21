from google.oauth2 import id_token
from google.auth.transport import requests
from sqlalchemy.orm import Session
from fastapi import HTTPException
from app.models.user import User
from app.core.config import settings
from app.core.security import create_access_token
import requests as http_requests


def verify_google_token(token: str) -> dict:
    """Verify Google ID token and return user info"""
    try:
        idinfo = id_token.verify_oauth2_token(
            token,
            requests.Request(),
            settings.GOOGLE_CLIENT_ID
        )


        return {
            "email": idinfo.get("email"),
            "name": idinfo.get("name"),
            "picture": idinfo.get("picture"),
            "google_id": idinfo.get("sub")
        }
    except ValueError as e:
        raise HTTPException(status_code=401, detail=f"Invalid token: {str(e)}")


def exchange_code_for_token(code: str) -> str:

    token_url = "https://oauth2.googleapis.com/token"

    data = {
        "code": code,
        "client_id": settings.GOOGLE_CLIENT_ID,
        "client_secret": settings.GOOGLE_CLIENT_SECRET,
        "redirect_uri": settings.GOOGLE_REDIRECT_URI,
        "grant_type": "authorization_code",
    }

    response = http_requests.post(token_url, data=data)

    if response.status_code != 200:
        raise HTTPException(
            status_code=400,
            detail=f"Failed to exchange code: {response.text}"
        )

    token_data = response.json()
    return token_data.get("id_token")


def authenticate_google_user(db: Session, code: str):
    """Authenticate user with Google OAuth code"""

    id_token_str = exchange_code_for_token(code)
    google_user_info = verify_google_token(id_token_str)
    user = db.query(User).filter(
        User.email == google_user_info["email"]
    ).first()

    if user:

        if not user.oauth_provider:
            user.oauth_provider = "google"
            user.oauth_id = google_user_info["google_id"]
            user.profile_picture = google_user_info["picture"]
            user.full_name = google_user_info["name"]
            db.commit()
            db.refresh(user)
    else:
        # Create new user
        user = User(
            email=google_user_info["email"],
            full_name=google_user_info["name"],
            oauth_provider="google",
            oauth_id=google_user_info["google_id"],
            profile_picture=google_user_info["picture"],
            hashed_password=None
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    access_token = create_access_token(data={"sub": user.email})

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user
    }
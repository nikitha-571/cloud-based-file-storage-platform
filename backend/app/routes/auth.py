from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.schemas.user import (
    UserCreate, UserLogin, UserResponse, Token,
    GoogleAuthRequest, GoogleAuthResponse
)
from app.services import auth_service
from app.services import google_oauth_service
from app.core.security import create_access_token, create_refresh_token
from app.core.security import create_access_token
from app.schemas.password_reset import PasswordResetRequest, PasswordResetConfirm
from app.core.config import settings
from app.core.dependencies import get_current_user

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=UserResponse)
def register(user: UserCreate, db: Session = Depends(get_db)):
    return auth_service.create_user(db, user)


@router.post("/login", response_model=Token)
def login(user_login: UserLogin, db: Session = Depends(get_db)):
    user = auth_service.authenticate_user(db, user_login.email, user_login.password)
    if not user:
        raise HTTPException(status_code=401, detail="Incorrect email or password")

    access_token = create_access_token(data={"sub": user.email})
    refresh_token = create_refresh_token(data={"sub": user.email})
    return {"access_token": access_token, "token_type": "bearer", "user": user}


@router.post("/refresh")
def refresh_token(current_user: str = Depends(get_current_user), db: Session = Depends(get_db)):
    """Refresh access token"""
    from app.models.user import User

    user = db.query(User).filter(User.email == current_user).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    new_access_token = create_access_token(data={"sub": user.email})
    new_refresh_token = create_refresh_token(data={"sub": user.email})

    return {
        "access_token": new_access_token,
        "refresh_token": new_refresh_token,
        "token_type": "bearer",
        "user": user
    }

@router.get("/google/url")
def get_google_auth_url():
    """Get Google OAuth URL for frontend to redirect to"""
    google_auth_url = (
        f"https://accounts.google.com/o/oauth2/v2/auth?"
        f"client_id={settings.GOOGLE_CLIENT_ID}&"
        f"redirect_uri={settings.GOOGLE_REDIRECT_URI}&"
        f"response_type=code&"
        f"scope=openid%20email%20profile&"
        f"access_type=offline"
    )
    return {"url": google_auth_url}

@router.post("/google/callback", response_model=GoogleAuthResponse)
def google_callback(auth_request: GoogleAuthRequest, db: Session = Depends(get_db)):
    """Handle Google OAuth callback"""
    return google_oauth_service.authenticate_google_user(db, auth_request.code)

@router.post("/forgot-password")
def forgot_password(request: PasswordResetRequest, db: Session = Depends(get_db)):
    """Request password reset"""
    result = auth_service.request_password_reset(db, request.email)
    return result

@router.post("/reset-password")
def reset_password(request: PasswordResetConfirm, db: Session = Depends(get_db)):
    """Reset password using token"""
    return auth_service.reset_password(db, request.token, request.new_password)

@router.get("/verify-reset-token/{token}")
def verify_reset_token(token: str, db: Session = Depends(get_db)):
    """Verify if reset token is valid"""
    try:
        auth_service.verify_reset_token(db, token)
        return {"valid": True}
    except HTTPException:
        return {"valid": False}
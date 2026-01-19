from sqlalchemy.orm import Session
from app.models.user import User
from app.schemas.user import UserCreate
from app.core.security import get_password_hash, verify_password
from fastapi import HTTPException
from datetime import datetime, timedelta
from app.models.password_reset import PasswordReset

def create_user(db: Session, user: UserCreate):
    # Check if user exists
    db_user = db.query(User).filter(User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    # Create new user with hashed password
    hashed_password = get_password_hash(user.password)
    db_user = User(
        email=user.email,
        hashed_password=hashed_password,
        full_name=user.full_name
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user


def authenticate_user(db: Session, email: str, password: str):
    user = db.query(User).filter(User.email == email).first()
    if not user:
        return False
    if user.hashed_password is None:
        # User created via OAuth (Google), doesn't have a password
        raise HTTPException(
            status_code=400,
            detail="This account uses Google Sign-In. Please use 'Continue with Google' to login."
        )
    if not verify_password(password, user.hashed_password):
        return False
    return user


def request_password_reset(db: Session, email: str):
    """Create a password reset token"""

    # Check if user exists
    user = db.query(User).filter(User.email == email).first()
    if not user:
        # For security, don't reveal if email exists
        return {"message": "If the email exists, a reset link will be sent"}

    if user.hashed_password is None and user.oauth_provider:
        return {
            "message": "This account uses Google Sign-In and doesn't have a password. Please login with Google."
        }

    # Invalidate any existing tokens
    db.query(PasswordReset).filter(
        PasswordReset.email == email,
        PasswordReset.is_used == False
    ).update({"is_used": True})

    # Create new reset token
    reset_token = PasswordReset(
        email=email,
        expires_at=datetime.utcnow() + timedelta(hours=1)  # Token expires in 1 hour
    )

    db.add(reset_token)
    db.commit()
    db.refresh(reset_token)

    # In production, send email here
    # For now, we'll return the token (remove this in production!)
    return {
        "message": "If the email exists, a reset link will be sent",
        "reset_token": reset_token.reset_token  # REMOVE IN PRODUCTION
    }


def verify_reset_token(db: Session, token: str):
    """Verify if reset token is valid"""

    reset_request = db.query(PasswordReset).filter(
        PasswordReset.reset_token == token,
        PasswordReset.is_used == False,
        PasswordReset.expires_at > datetime.utcnow()
    ).first()

    if not reset_request:
        raise HTTPException(status_code=400, detail="Invalid or expired reset token")

    return reset_request


def reset_password(db: Session, token: str, new_password: str):
    """Reset user password using token"""

    # Verify token
    reset_request = verify_reset_token(db, token)

    # Get user
    user = db.query(User).filter(User.email == reset_request.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Update password
    user.hashed_password = get_password_hash(new_password)

    # Mark token as used
    reset_request.is_used = True

    db.commit()

    return {"message": "Password reset successfully"}
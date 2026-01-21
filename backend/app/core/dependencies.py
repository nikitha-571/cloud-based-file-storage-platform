
from fastapi import Depends, HTTPException, status, Header
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
from typing import Optional
from .config import settings

security = HTTPBearer(auto_error=False)


def get_current_user(
        authorization: Optional[str] = Header(None),
        credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)
) -> str:

    token = None


    if credentials:
        token = credentials.credentials
        print(f"🔐 Token from HTTPBearer: {token[:30]}...")

    elif authorization:
        if authorization.startswith("Bearer "):
            token = authorization.replace("Bearer ", "")
            print(f"🔐 Token from Header: {token[:30]}...")
        else:
            token = authorization
            print(f"🔐 Token from Header (no Bearer): {token[:30]}...")

    if not token:
        print("❌ No token found in request")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
            headers={"WWW-Authenticate": "Bearer"},
        )

    print(f"🔐 AUTH CHECK")
    print(f"   Token (first 30 chars): {token[:30]}...")

    try:
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM]
        )
        email: str = payload.get("sub")

        print(f"   ✅ Token valid for user: {email}")

        if email is None:
            print(f"   ❌ No 'sub' in token payload")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Could not validate credentials",
                headers={"WWW-Authenticate": "Bearer"},
            )

        return email

    except JWTError as e:
        print(f"   ❌ JWT Error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
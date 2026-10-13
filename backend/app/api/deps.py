import jwt
from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.models import User
from app.utils.database import get_db
from app.utils.security import decode_token

bearer = HTTPBearer(auto_error=False)


def current_user(creds: HTTPAuthorizationCredentials = Depends(bearer), db: Session = Depends(get_db)) -> User:
    unauthorized = HTTPException(status_code=401, detail="Not authenticated", headers={"WWW-Authenticate": "Bearer"})
    if not creds:
        raise unauthorized
    try:
        payload = decode_token(creds.credentials)
    except jwt.PyJWTError:
        raise unauthorized
    user = db.get(User, payload.get("sub"))
    if not user:
        raise unauthorized
    return user


def require_roles(*roles):
    """The role is read from the database, never trusted from the token."""
    def dependency(user: User = Depends(current_user)) -> User:
        if user.role not in roles:
            raise HTTPException(status_code=403, detail="You do not have access to this resource")
        return user
    return dependency
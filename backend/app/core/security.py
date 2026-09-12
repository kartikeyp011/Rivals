from typing import Optional, Dict, Any
from fastapi import Request, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from .config import settings
from .errors import UnauthorizedError
import logging

logger = logging.getLogger(__name__)

security = HTTPBearer()

def verify_jwt(token: str) -> Dict[str, Any]:
    try:
        # Supabase uses HS256 by default with the JWT secret
        payload = jwt.decode(
            token,
            settings.SUPABASE_JWT_SECRET,
            algorithms=["HS256"],
            options={"verify_aud": False} # Default Supabase tokens sometimes use different aud claims, let's keep it simple or verify if needed
        )
        
        # Ensure the sub claim (user id) exists
        if "sub" not in payload:
            raise UnauthorizedError("Invalid token: missing subject (sub) claim")
            
        return payload
    except JWTError as e:
        logger.warning(f"JWT validation failed: {str(e)}")
        raise UnauthorizedError("Invalid or expired token")

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> str:
    """
    Dependency to get the current authenticated user's ID from the JWT.
    Raises UnauthorizedError if the token is invalid.
    """
    token = credentials.credentials
    payload = verify_jwt(token)
    return payload["sub"]

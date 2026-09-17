from typing import Optional, Dict, Any
from fastapi import Request, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import jwt
from jwt import PyJWKClient, PyJWTError
from .config import settings
from .errors import UnauthorizedError
import logging

logger = logging.getLogger(__name__)

security = HTTPBearer()

_jwks_client: Optional[PyJWKClient] = None

def get_jwks_client() -> PyJWKClient:
    global _jwks_client
    if _jwks_client is None:
        jwks_url = settings.SUPABASE_JWKS_URL or f"{settings.SUPABASE_URL}/auth/v1/.well-known/jwks.json"
        _jwks_client = PyJWKClient(jwks_url)
    return _jwks_client

def verify_jwt(token: str) -> Dict[str, Any]:
    try:
        unverified_header = jwt.get_unverified_header(token)
        alg = unverified_header.get("alg")

        expected_issuer = f"{settings.SUPABASE_URL}/auth/v1"
        expected_audience = "authenticated"

        if alg == "HS256":
            key = settings.SUPABASE_JWT_SECRET
        elif alg in ["ES256", "RS256"]:
            jwks_client = get_jwks_client()
            signing_key = jwks_client.get_signing_key_from_jwt(token)
            key = signing_key.key
        else:
            raise UnauthorizedError(f"Unsupported JWT algorithm: {alg}")

        payload = jwt.decode(
            token,
            key,
            algorithms=[alg],
            audience=expected_audience,
            issuer=expected_issuer,
        )

        if "sub" not in payload:
            raise UnauthorizedError("Invalid token: missing subject (sub) claim")

        return payload
    except PyJWTError as e:
        logger.warning(f"JWT validation failed: {str(e)}")
        raise UnauthorizedError("Invalid or expired token")
    except Exception as e:
        if isinstance(e, UnauthorizedError):
            raise
        logger.warning(f"Unexpected error validating JWT: {str(e)}")
        raise UnauthorizedError("Invalid or expired token")

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> str:
    """
    Dependency to get the current authenticated user's ID from the JWT.
    Raises UnauthorizedError if the token is invalid.
    """
    token = credentials.credentials
    payload = verify_jwt(token)
    return payload["sub"]

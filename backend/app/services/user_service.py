from typing import List, Optional
from asyncpg import Connection
import httpx
import time
import jwt
import logging

from app.schemas.user import UserSearchResponse
from app.repositories.user_repository import UserRepository
from app.core.config import settings
from app.core.errors import AppError

logger = logging.getLogger(__name__)

class UserService:
    def __init__(self, conn: Connection):
        self.conn = conn
        self.repo = UserRepository(conn)

    async def search_users(self, query: str) -> List[UserSearchResponse]:
        if not query or len(query) < 2:
            return []
        return await self.repo.search_users(query)

    async def _generate_apple_client_secret(self) -> Optional[str]:
        if not all([settings.APPLE_TEAM_ID, settings.APPLE_CLIENT_ID, settings.APPLE_KEY_ID, settings.APPLE_PRIVATE_KEY]):
            return None
        try:
            headers = {
                "kid": settings.APPLE_KEY_ID,
                "alg": "ES256"
            }
            payload = {
                "iss": settings.APPLE_TEAM_ID,
                "iat": int(time.time()),
                "exp": int(time.time()) + 15777000,
                "aud": "https://appleid.apple.com",
                "sub": settings.APPLE_CLIENT_ID,
            }
            # The private key should have standard newlines
            private_key = settings.APPLE_PRIVATE_KEY.replace("\\n", "\n")
            client_secret = jwt.encode(payload, private_key, algorithm="ES256", headers=headers)
            return client_secret
        except Exception as e:
            logger.error(f"Failed to generate Apple client secret: {e}")
            return None

    async def _revoke_apple_token(self, token: str) -> None:
        client_secret = await self._generate_apple_client_secret()
        if not client_secret:
            logger.warning("Apple credentials not fully configured; skipping Apple revocation")
            return

        data = {
            "client_id": settings.APPLE_CLIENT_ID,
            "client_secret": client_secret,
            "token": token,
            "token_type_hint": "refresh_token"
        }
        headers = {
            "Content-Type": "application/x-www-form-urlencoded"
        }
        try:
            async with httpx.AsyncClient() as client:
                res = await client.post("https://appleid.apple.com/auth/oauth2/v2/revoke", data=data, headers=headers)
                if res.status_code != 200:
                    logger.warning("Apple revocation failed, HTTP %d", res.status_code)
        except Exception as e:
            logger.warning(f"Apple revocation request failed: {e}")

    async def delete_account(self, user_id: str) -> dict:
        # 1. Clean up personal data in a transaction
        async with self.conn.transaction():
            await self.repo.delete_user_data(user_id)

        # 2. Attempt Apple revocation (best-effort)
        try:
            apple_refresh_token = await self.repo.get_apple_refresh_token(user_id)
            if apple_refresh_token:
                await self._revoke_apple_token(apple_refresh_token)
        except Exception as e:
            logger.warning(f"Failed during best-effort Apple token retrieval: {e}")

        # 3. Delete Supabase Auth account
        try:
            headers = {
                "Authorization": f"Bearer {settings.SUPABASE_SERVICE_ROLE_KEY}",
                "apikey": settings.SUPABASE_SERVICE_ROLE_KEY
            }
            async with httpx.AsyncClient() as client:
                url = f"{settings.SUPABASE_URL}/auth/v1/admin/users/{user_id}"
                res = await client.delete(url, headers=headers)
                # 404 means the user is already deleted (safe repeated request)
                if res.status_code not in (200, 204, 404):
                    logger.error(f"Supabase Admin API deletion failed: HTTP {res.status_code} {res.text}")
                    raise AppError(message="Account data deleted, but failed to remove Auth account.", status_code=500)
        except httpx.RequestError as e:
            logger.error(f"Supabase Admin API request failed: {e}")
            raise AppError(message="Account data deleted, but failed to connect to Auth service.", status_code=500)

        return {"status": "success", "message": "Account fully deleted"}

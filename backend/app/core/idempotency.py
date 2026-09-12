import json
import logging
from typing import Optional, Any
from asyncpg import Connection
from fastapi import Request, Response
from fastapi.responses import JSONResponse
from .errors import ConflictError

logger = logging.getLogger(__name__)

class IdempotencyManager:
    def __init__(self, conn: Connection, user_id: str, idempotency_key: Optional[str]):
        self.conn = conn
        self.user_id = user_id
        self.idempotency_key = idempotency_key
        self._is_replayed = False

    async def get_cached_response(self, request_body: Optional[dict] = None) -> Optional[JSONResponse]:
        if not self.idempotency_key:
            return None

        # Try to find an existing key for this user
        row = await self.conn.fetchrow(
            """
            SELECT response_status, response_body, request_body 
            FROM idempotency_keys 
            WHERE idempotency_key = $1 AND user_id = $2
            """,
            self.idempotency_key, self.user_id
        )

        if row:
            if row['response_status'] is None:
                raise ConflictError("Request is already in progress")
            
            # Compare payloads
            if request_body is not None and row['request_body']:
                cached_body = json.loads(row['request_body'])
                if cached_body != request_body:
                    raise ConflictError("IDEMPOTENCY_KEY_REUSED")

            logger.info(f"Returning cached response for idempotency key {self.idempotency_key}")
            
            headers = {"Idempotent-Replayed": "true"}
            return JSONResponse(
                status_code=row['response_status'],
                content=json.loads(row['response_body']),
                headers=headers
            )
            
        return None

    async def lock_key(self, request_path: str, request_body: Optional[dict] = None):
        if not self.idempotency_key:
            return
            
        try:
            # We do an insert to lock the key. If it fails due to unique constraint, another request is in progress.
            # In PostgreSQL we can just insert and handle unique violation, or do it inside the transaction.
            await self.conn.execute(
                """
                INSERT INTO idempotency_keys (idempotency_key, user_id, request_path, request_body, expires_at)
                VALUES ($1, $2, $3, $4, now() + interval '24 hours')
                """,
                self.idempotency_key,
                self.user_id,
                request_path,
                json.dumps(request_body) if request_body else None
            )
        except Exception as e:
            # Catch asyncpg.exceptions.UniqueViolationError
            if 'unique constraint' in str(e).lower() or '23505' in str(e):
                raise ConflictError("Request is already in progress")
            raise

    async def save_response(self, status_code: int, response_body: Any):
        if not self.idempotency_key:
            return
            
        await self.conn.execute(
            """
            UPDATE idempotency_keys
            SET response_status = $1, response_body = $2
            WHERE idempotency_key = $3 AND user_id = $4
            """,
            status_code,
            json.dumps(response_body),
            self.idempotency_key,
            self.user_id
        )

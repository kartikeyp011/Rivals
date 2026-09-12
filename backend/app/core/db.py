import asyncpg
from typing import Optional
from fastapi import Request
import logging

from .config import settings

logger = logging.getLogger(__name__)

# Global connection pool
_pool: Optional[asyncpg.Pool] = None

async def init_db_pool() -> asyncpg.Pool:
    global _pool
    try:
        _pool = await asyncpg.create_pool(
            dsn=settings.DATABASE_URL,
            min_size=2,
            max_size=10,
            command_timeout=60,
            # Pass the application name to identify connections
            server_settings={'application_name': 'rivals-fastapi'}
        )
        logger.info("Database connection pool initialized")
        return _pool
    except Exception as e:
        logger.error(f"Failed to initialize database pool: {e}")
        raise

async def close_db_pool():
    global _pool
    if _pool:
        await _pool.close()
        logger.info("Database connection pool closed")

async def get_db_pool() -> asyncpg.Pool:
    if _pool is None:
        raise RuntimeError("Database pool has not been initialized")
    return _pool

async def get_db_connection():
    """Dependency to get a single connection from the pool."""
    pool = await get_db_pool()
    async with pool.acquire() as conn:
        yield conn

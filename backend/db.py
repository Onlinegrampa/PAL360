import os
import ssl as ssl_module
import asyncpg

_pool: asyncpg.Pool | None = None


async def init_pool() -> asyncpg.Pool:
    global _pool
    database_url = os.getenv("DATABASE_URL")
    if not database_url:
        raise RuntimeError("DATABASE_URL environment variable is not set")

    # Normalize scheme — some providers give postgres://, asyncpg needs postgresql://
    database_url = database_url.replace("postgres://", "postgresql://", 1)

    # Neon and other cloud providers require SSL
    ssl_ctx = None
    if "neon.tech" in database_url or "sslmode=require" in database_url:
        ssl_ctx = ssl_module.create_default_context()
        ssl_ctx.check_hostname = False
        ssl_ctx.verify_mode = ssl_module.CERT_NONE

    # Strip sslmode query param — asyncpg reads it separately via ssl=
    clean_url = database_url.split("?")[0]

    _pool = await asyncpg.create_pool(
        clean_url,
        ssl=ssl_ctx,
        min_size=1,
        max_size=10,
    )
    return _pool


async def close_pool() -> None:
    global _pool
    if _pool:
        await _pool.close()
        _pool = None


def get_pool() -> asyncpg.Pool:
    if _pool is None:
        raise RuntimeError("Database pool not initialised — app startup did not complete")
    return _pool

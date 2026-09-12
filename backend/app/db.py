import os
from collections.abc import AsyncGenerator
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.pool import StaticPool

from .models import Base

# Dev default is a local SQLite file (zero setup); production sets
# DATABASE_URL to Postgres (e.g. postgresql+asyncpg://... on Render/Neon).
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite+aiosqlite:///./qestia.db")

# Neon/Render may pass postgresql:// — async engine needs postgresql+asyncpg://
if DATABASE_URL.startswith("postgresql://"):
    DATABASE_URL = "postgresql+asyncpg://" + DATABASE_URL[len("postgresql://"):]
elif DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = "postgresql+asyncpg://" + DATABASE_URL[len("postgres://"):]

# Strip sslmode param (asyncpg doesn't accept it) — SSL is enabled by default on port 5432
if "?sslmode=" in DATABASE_URL:
    DATABASE_URL = DATABASE_URL.split("?sslmode=")[0]
elif "&sslmode=" in DATABASE_URL:
    DATABASE_URL = DATABASE_URL.split("&sslmode=")[0]

if DATABASE_URL.startswith("sqlite"):
    if ":memory:" in DATABASE_URL:
        # Single shared connection so :memory: survives across sessions (tests)
        engine = create_async_engine(
            DATABASE_URL,
            poolclass=StaticPool,
            connect_args={"check_same_thread": False},
        )
    else:
        engine = create_async_engine(DATABASE_URL)
else:
    # On Vercel the app runs as a serverless function talking to Neon. Use the
    # pooled connection string (port 6543) to avoid exhausting the free tier's
    # connection limit. pgBouncer's transaction pooling is incompatible with
    # asyncpg's prepared-statement cache, so disable it.
    engine = create_async_engine(
        DATABASE_URL,
        pool_pre_ping=True,
        connect_args={"prepared_statement_cache_size": 0},
    )

SessionLocal = async_sessionmaker(engine, expire_on_commit=False)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with SessionLocal() as session:
        yield session


async def init_db() -> None:
    """Create tables if they don't exist (dev). Idempotent — production
    applies sql/001_initial_schema.sql and this is a no-op."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

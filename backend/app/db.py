import os
from collections.abc import AsyncGenerator
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.pool import StaticPool

from .models import Base

# Dev default is a local SQLite file (zero setup); production sets
# DATABASE_URL to Postgres (e.g. postgresql+asyncpg://... on Render/Neon).
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite+aiosqlite:///./nivora.db")

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
    engine = create_async_engine(DATABASE_URL, pool_pre_ping=True)

SessionLocal = async_sessionmaker(engine, expire_on_commit=False)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with SessionLocal() as session:
        yield session


async def init_db() -> None:
    """Create tables if they don't exist (dev). Idempotent — production
    applies sql/001_initial_schema.sql and this is a no-op."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

import os

# Must be set before the app modules are imported (engine is created at import).
os.environ.setdefault("DATABASE_URL", "sqlite+aiosqlite:///:memory:")
os.environ.setdefault("DISPUTE_WINDOW_SECONDS", "0")
os.environ.setdefault("PAYMENTS_MODE", "mock")

import httpx
import pytest
from httpx import ASGITransport

from backend.app import main as main_module
from backend.app.db import Base, engine


@pytest.fixture()
async def client():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)
    transport = ASGITransport(app=main_module.app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as c:
        yield c

import os

# Must be set before the app modules are imported (engine is created at import).
os.environ.setdefault("DATABASE_URL", "sqlite+aiosqlite:///:memory:")
os.environ.setdefault("DISPUTE_WINDOW_SECONDS", "0")
os.environ.setdefault("PAYMENTS_MODE", "mock")
os.environ.setdefault("SETTLEMENT_TOKEN", "test-token")
os.environ.setdefault("ESCROW_ADDRESS", "NQ02 4RCH AXQ1 P50Y 2LJV F9RN 0FCX 4VKM YYQ0")

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


@pytest.fixture()
async def real_mode(monkeypatch):
    """Flip the backend into real-payments mode with a fake chain client."""
    from backend.app import services

    monkeypatch.setenv("PAYMENTS_MODE", "real")
    monkeypatch.setattr(services, "PAYMENTS_MODE", "real")

    class FakeChain:
        def __init__(self):
            self.txs: dict[str, dict] = {}

        def add_tx(self, tx_hash: str, *, to: str, value_luna: int, data_hex: str, frm: str) -> None:
            self.txs[tx_hash] = {
                "hash": tx_hash,
                "blockNumber": 123,
                "to": to,
                "from": frm,
                "value": value_luna,
                "recipientData": data_hex,
                "senderData": "",
            }

        async def get_transaction(self, tx_ref: str):
            return self.txs.get(tx_ref)

    fake = FakeChain()
    main_module.app.state.chain = fake
    yield fake
    main_module.app.state.chain = None

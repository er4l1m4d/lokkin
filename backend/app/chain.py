"""Nimiq chain access for real-payments mode.

Verification strategy: the client sends the transaction through its wallet
(Nimiq Pay mini-app provider), then submits the returned reference to the
backend. The backend looks the transaction up on a Nimiq JSON-RPC node and
validates recipient / value / memo / sender before confirming the commitment.
"""

import os
from typing import Any, Protocol

import httpx

LUNAS_PER_NIM = 100_000


def escrow_address() -> str | None:
    addr = os.getenv("ESCROW_ADDRESS")
    return addr.strip() if addr else None


def rpc_url() -> str | None:
    url = os.getenv("NIMIQ_RPC_URL")
    return url.strip() if url else None


def payments_mode() -> str:
    return os.getenv("PAYMENTS_MODE", "mock")


class ChainClient(Protocol):
    async def get_transaction(self, tx_ref: str) -> dict[str, Any] | None:
        """Return on-chain TransactionInfo for a hash, or None if unknown."""
        ...


class NoopChainClient:
    """Default when no RPC is configured: transactions stay PENDING."""

    async def get_transaction(self, tx_ref: str) -> dict[str, Any] | None:
        return None


class RpcChainClient:
    """JSON-RPC client for a Nimiq node (`getTransactionByHash`)."""

    def __init__(self, url: str):
        self.url = url

    async def get_transaction(self, tx_ref: str) -> dict[str, Any] | None:
        # Nimiq JSON-RPC accepts positional or named params depending on node;
        # try positional first, fall back to named.
        for params in ([tx_ref], {"hash": str(tx_ref)}):
            try:
                async with httpx.AsyncClient(timeout=10) as client:
                    res = await client.post(
                        self.url,
                        json={"jsonrpc": "2.0", "id": 1, "method": "getTransactionByHash", "params": params},
                    )
                data = res.json()
            except (httpx.HTTPError, ValueError):
                continue
            result = data.get("result")
            if result is not None:
                return result
            error = data.get("error")
            # Unknown hash → None (not found yet); other errors → try next form
            if error and "not found" in str(error).get("message", "").lower():
                return None
        return None


def create_chain_client() -> ChainClient:
    url = rpc_url()
    return RpcChainClient(url) if url else NoopChainClient()

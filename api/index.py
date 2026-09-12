"""Vercel serverless entrypoint for the Qestia FastAPI app.

This project is a single Vercel deployment: the Vite frontend lives in
`frontend/` and this Python function (under `api/`) is the backend, served
from the same origin at `/api/*`. Vercel's Python runtime serves this module's
`app` as an ASGI application directly.
"""
import os
import sys

# The backend package lives in `backend/`; make it importable from this
# function regardless of Vercel's working directory.
sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "backend"))

from app.main import app  # noqa: F401 — Vercel imports `app` from this module

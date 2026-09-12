"""Vercel serverless entrypoint for the Qestia FastAPI app.

This project is a single Vercel deployment: the Vite frontend lives in
`frontend/` and this Python function (under `api/`) is the backend, served
from the same origin at `/api/*`. Vercel's Python runtime serves this module's
`app` as an ASGI application. Mangum wraps the FastAPI app so its lifespan
(init_db + chain client) runs once per cold start — Vercel's native ASGI
adapter does not reliably fire lifespan events.
"""
import os
import sys

# The backend package lives in `backend/`; make it importable from this
# function regardless of Vercel's working directory.
sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "backend"))

from mangum import Mangum
from app.main import app as fastapi_app

app = Mangum(fastapi_app, lifespan="on")

# routes/grok_sync_routes.py
"""
API routes for Grok CLI <-> Odysseus session synchronization.

Endpoints:
  GET  /api/grok/sync/status   — Get sync status (counts, last sync time)
  POST /api/grok/sync          — Trigger a full sync (query param ?full=1)
  GET  /api/grok/sync          — Same as status (for convenience)
"""

import logging
from fastapi import APIRouter, Query
from pydantic import BaseModel

from core.grok_sync import sync_all, get_sync_status

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/grok", tags=["grok-sync"])


class SyncStatusResponse(BaseModel):
    grok_sessions_total: int
    odysseus_synced: int
    last_sync: str | None
    grok_home: str
    sync_folder: str


class SyncResultResponse(BaseModel):
    created: int
    updated: int
    skipped: int
    errors: int
    total_grok: int
    details: list


@router.get("/sync/status", response_model=SyncStatusResponse)
async def grok_sync_status():
    """Return current sync status between Grok CLI and Odysseus."""
    return get_sync_status()


@router.get("/sync", response_model=SyncStatusResponse)
async def grok_sync_get():
    """GET /api/grok/sync — alias for status."""
    return get_sync_status()


@router.post("/sync", response_model=SyncResultResponse)
async def grok_sync_trigger(
    full: bool = Query(False, description="Re-sync message content too"),
):
    """
    Trigger a sync of all Grok CLI sessions into Odysseus.
    
    - full=false (default): Only add new sessions, update metadata of existing ones.
    - full=true: Re-import messages for all existing synced sessions too.
    """
    logger.info("Manual sync triggered (full=%s)", full)
    result = sync_all(full=full)
    return result

# core/grok_sync.py
"""
Grok CLI <-> Odysseus Session Sync Bridge.

Reads sessions from the Grok CLI's on-disk storage (SQLite index + JSONL chat files)
and mirrors them into Odysseus's SQLite database so they appear in the web UI.
"""

import json
import os
import logging
import sqlite3
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, List, Optional, Tuple, Any

from .database import Session as DbSession, ChatMessage as DbChatMessage, SessionLocal, utcnow_naive

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

DEFAULT_GROK_HOME = os.path.expanduser("~/.grok")
GROK_HOME = os.getenv("GROK_HOME", DEFAULT_GROK_HOME)
SESSIONS_DIR = os.path.join(GROK_HOME, "sessions")
SEARCH_DB_PATH = os.path.join(SESSIONS_DIR, "session_search.sqlite")

SYNC_SOURCE_TAG = "grok-cli-sync"
SYNC_FOLDER = "Grok CLI"


def _parse_iso(s: Optional[str]) -> Optional[datetime]:
    """Parse ISO-8601 string to naive UTC datetime."""
    if not s:
        return None
    try:
        s = s.replace("Z", "+00:00")
        dt = datetime.fromisoformat(s)
        if dt.tzinfo is not None:
            dt = dt.astimezone(timezone.utc).replace(tzinfo=None)
        return dt
    except (ValueError, TypeError):
        return None


# ---------------------------------------------------------------------------
# Grok session readers
# ---------------------------------------------------------------------------

def _iter_grok_session_dirs():
    """Yield (session_dir_path, summary_dict) for every Grok session on disk."""
    sessions_base = Path(SESSIONS_DIR)
    if not sessions_base.is_dir():
        logger.warning("Grok sessions directory not found: %s", SESSIONS_DIR)
        return

    for cwd_entry in sorted(sessions_base.iterdir()):
        if not cwd_entry.is_dir() or cwd_entry.name.endswith(".sqlite"):
            continue
        for sess_dir in sorted(cwd_entry.iterdir()):
            if not sess_dir.is_dir():
                continue
            summary_path = sess_dir / "summary.json"
            history_path = sess_dir / "chat_history.jsonl"
            if not summary_path.exists() or not history_path.exists():
                continue
            try:
                summary = json.loads(summary_path.read_text())
            except (json.JSONDecodeError, OSError) as e:
                logger.debug("Bad summary in %s: %s", sess_dir.name, e)
                continue
            yield str(sess_dir), summary


def _read_chat_history(session_dir: str) -> list:
    """Parse chat_history.jsonl into a list of message dicts."""
    path = os.path.join(session_dir, "chat_history.jsonl")
    messages = []
    if not os.path.exists(path):
        return messages
    try:
        with open(path, "r", encoding="utf-8") as f:
            for line_no, raw_line in enumerate(f, 1):
                line = raw_line.strip()
                if not line:
                    continue
                try:
                    obj = json.loads(line)
                    obj["_line_no"] = line_no
                    messages.append(obj)
                except json.JSONDecodeError:
                    logger.debug("Skipping bad JSONL line %d in %s", line_no, path)
                    continue
    except OSError as e:
        logger.warning("Cannot read %s: %s", path, e)
    return messages


def _extract_user_text(content: Any) -> str:
    """Extract plain text from a Grok user message content field."""
    if isinstance(content, str):
        return content
    if isinstance(content, list):
        texts = []
        for block in content:
            if isinstance(block, dict) and block.get("type") == "text":
                text = block.get("text", "")
                start_tag = "<user_query>"
                end_tag = "</user_query>"
                if start_tag in text and end_tag in text:
                    idx1 = text.index(start_tag) + len(start_tag)
                    idx2 = text.index(end_tag, idx1)
                    text = text[idx1:idx2].strip()
                texts.append(text)
        return "\n".join(texts)
    return str(content) if content else ""


def _extract_assistant_text(content: Any) -> str:
    """Extract readable text from an assistant message's content array."""
    if isinstance(content, str):
        return content
    if isinstance(content, list):
        texts = []
        for block in content:
            if isinstance(block, dict):
                btype = block.get("type", "")
                if btype == "text":
                    texts.append(block.get("text", ""))
                elif btype == "tool_result":
                    result = block.get("content", "") or ""
                    if isinstance(result, list):
                        for r in result:
                            if isinstance(r, dict) and r.get("type") == "text":
                                texts.append(r.get("text", ""))
                    elif isinstance(result, str):
                        texts.append(result[:500])
        return "\n".join(texts)
    return str(content) if content else ""


# ---------------------------------------------------------------------------
# Message conversion
# ---------------------------------------------------------------------------

def _convert_grok_messages(grok_msgs: list) -> list:
    """Convert Grok chat_history.jsonl entries into Odysseus ChatMessage format."""
    odysseus_msgs = []
    for gm in grok_msgs:
        msg_type = gm.get("type", "")
        if msg_type == "system":
            continue
        if gm.get("synthetic_reason"):
            continue
        if msg_type == "user":
            text = _extract_user_text(gm.get("content"))
            if not text.strip():
                continue
            odysseus_msgs.append({
                "role": "user",
                "content": text,
                "metadata": {"source": SYNC_SOURCE_TAG},
            })
        elif msg_type == "assistant":
            text = _extract_assistant_text(gm.get("content"))
            if not text.strip():
                continue
            odysseus_msgs.append({
                "role": "assistant",
                "content": text,
                "metadata": {"source": SYNC_SOURCE_TAG},
            })
    return odysseus_msgs


# ---------------------------------------------------------------------------
# Model mapping
# ---------------------------------------------------------------------------

def _resolve_model(grok_model_id: str) -> str:
    """Map a Grok model ID to an Odysseus-compatible model identifier."""
    clean = grok_model_id.replace("zai-", "") if grok_model_id.startswith("zai-") else grok_model_id
    if clean.startswith("coding-"):
        clean = "glm-5"
    return clean


def _resolve_endpoint_url() -> str:
    """Determine which endpoint URL to use for synced sessions."""
    url = os.getenv("LLM_HOST", "").strip()
    if not url:
        url = "https://api.z.ai/api/coding/paas/v4"
    return url.rstrip("/")


# ---------------------------------------------------------------------------
# Core sync logic
# ---------------------------------------------------------------------------

def get_grok_sessions_count() -> int:
    """Return count of discoverable Grok sessions (quick check)."""
    if not os.path.exists(SEARCH_DB_PATH):
        return 0
    try:
        conn = sqlite3.connect(SEARCH_DB_PATH)
        row = conn.execute("SELECT COUNT(*) FROM session_docs").fetchone()
        conn.close()
        return row[0] if row else 0
    except sqlite3.Error:
        return 0


def sync_all(full: bool = False) -> dict:
    """
    Perform a full sync of all Grok CLI sessions into Odysseus.
    
    Args:
        full: If True, re-sync message content even for existing sessions.
    Returns:
        Stats dict with keys: created, updated, skipped, errors, total_grok
    """
    stats = {
        "created": 0,
        "updated": 0,
        "skipped": 0,
        "errors": 0,
        "total_grok": 0,
        "details": [],
    }

    endpoint_url = _resolve_endpoint_url()
    db = SessionLocal()

    try:
        for session_dir, summary in _iter_grok_session_dirs():
            stats["total_grok"] += 1
            try:
                session_id = summary.get("info", {}).get("id")
                if not session_id:
                    stats["skipped"] += 1
                    continue

                title = summary.get("session_summary") or summary.get("generated_title") or "Untitled"
                grok_model = summary.get("current_model_id", "glm-5")
                model = _resolve_model(grok_model)
                created_at = _parse_iso(summary.get("created_at"))
                updated_at = _parse_iso(summary.get("updated_at"))
                last_active = _parse_iso(summary.get("last_active_at")) or updated_at
                num_messages = summary.get("num_chat_messages", 0)

                existing = db.query(DbSession).filter_by(id=session_id).first()

                if existing:
                    existing.name = title[:200]
                    existing.model = model
                    existing.updated_at = updated_at or utcnow_naive()
                    existing.last_accessed = last_active or utcnow_naive()
                    existing.message_count = num_messages
                    if full:
                        _sync_messages(db, session_id, session_dir, num_messages)
                    stats["updated"] += 1
                    stats["details"].append({"id": session_id, "name": title, "action": "updated"})
                else:
                    new_sess = DbSession(
                        id=session_id,
                        name=title[:200],
                        endpoint_url=endpoint_url,
                        model=model,
                        folder=SYNC_FOLDER,
                        rag=False,
                        archived=False,
                        owner=None,
                        headers={},
                        message_count=num_messages,
                        mode="chat",
                        created_at=created_at or utcnow_naive(),
                        updated_at=updated_at or utcnow_naive(),
                        last_accessed=last_active or utcnow_naive(),
                        last_message_at=last_active or utcnow_naive(),
                    )
                    db.add(new_sess)
                    db.flush()
                    imported = _sync_messages(db, session_id, session_dir, num_messages)
                    new_sess.message_count = imported
                    stats["created"] += 1
                    stats["details"].append({"id": session_id, "name": title, "action": "created"})

            except Exception as e:
                stats["errors"] += 1
                logger.error("Error syncing session %s: %s", session_dir, e)
                stats["details"].append({"id": "???", "error": str(e)})

        db.commit()

    except Exception as e:
        db.rollback()
        logger.error("Sync failed: %s", e)
        raise
    finally:
        db.close()

    logger.info(
        "Grok sync complete: created=%d updated=%d skipped=%d errors=%d (total=%d)",
        stats["created"], stats["updated"], stats["skipped"], stats["errors"],
        stats["total_grok"],
    )
    return stats


def _sync_messages(db, session_id: str, session_dir: str, expected_count: int) -> int:
    """Sync messages for a single session. Returns count of imported messages."""
    # Delete old synced messages to avoid duplicates on re-sync
    db.query(DbChatMessage).filter(
        DbChatMessage.session_id == session_id,
        DbChatMessage.meta_data.like(f'%"{SYNC_SOURCE_TAG}"%')
    ).delete(synchronize_session=False)

    grok_msgs = _read_chat_history(session_dir)
    odysseus_msgs = _convert_grok_messages(grok_msgs)

    imported = 0
    for om in odysseus_msgs:
        msg_id = str(uuid.uuid4())
        db_msg = DbChatMessage(
            id=msg_id,
            session_id=session_id,
            role=om["role"],
            content=om["content"],
            meta_data=json.dumps(om.get("metadata", {})),
            timestamp=utcnow_naive(),
        )
        db.add(db_msg)
        imported += 1

    if imported == 0 and expected_count > 0:
        placeholder = DbChatMessage(
            id=str(uuid.uuid4()),
            session_id=session_id,
            role="user",
            content="[Session synced from Grok CLI - message content could not be converted]",
            meta_data=json.dumps({"source": SYNC_SOURCE_TAG, "note": "placeholder"}),
            timestamp=utcnow_naive(),
        )
        db.add(placeholder)
        imported = 1

    return imported


def get_sync_status() -> dict:
    """Return current sync status between Grok CLI and Odysseus."""
    grok_total = get_grok_sessions_count()
    db = SessionLocal()
    try:
        synced_count = db.query(DbSession).filter(DbSession.folder == SYNC_FOLDER).count()
        latest_sync = None
        latest = db.query(DbSession).filter(
            DbSession.folder == SYNC_FOLDER
        ).order_by(DbSession.updated_at.desc()).first()
        if latest and latest.updated_at:
            latest_sync = latest.updated_at.isoformat()
    finally:
        db.close()

    return {
        "grok_sessions_total": grok_total,
        "odysseus_synced": synced_count,
        "last_sync": latest_sync,
        "grok_home": GROK_HOME,
        "sync_folder": SYNC_FOLDER,
    }

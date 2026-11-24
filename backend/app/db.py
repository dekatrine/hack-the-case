"""Хранилище пользователей и прогресса на SQLite (stdlib, без зависимостей).

Путь к базе задаётся env-переменной DB_PATH (по умолчанию backend/data/app.db).
На Render подключи Persistent Disk и укажи DB_PATH на него, иначе диск
эфемерный и база обнулится при redeploy. Локально работает из коробки.

Схема:
  users(id, token, created_at)
  progress(user_id, data JSON, updated_at ms)
  link_codes(code, user_id, expires_at)  — короткие коды переноса на другое устройство
"""

import json
import os
import secrets
import sqlite3
import string
import time
from pathlib import Path
from threading import Lock
from typing import Optional

_DEFAULT_PATH = Path(__file__).resolve().parents[1] / "data" / "app.db"
_lock = Lock()
_conn: Optional[sqlite3.Connection] = None

CODE_ALPHABET = string.ascii_uppercase + string.digits
CODE_TTL_SECONDS = 600


def _connect() -> sqlite3.Connection:
    db_path = Path(os.getenv("DB_PATH", str(_DEFAULT_PATH)))
    db_path.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(str(db_path), check_same_thread=False)
    conn.execute("PRAGMA journal_mode=WAL")
    conn.executescript(
        """
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            token TEXT UNIQUE NOT NULL,
            created_at INTEGER NOT NULL
        );
        CREATE TABLE IF NOT EXISTS progress (
            user_id TEXT PRIMARY KEY REFERENCES users(id),
            data TEXT NOT NULL,
            updated_at INTEGER NOT NULL
        );
        CREATE TABLE IF NOT EXISTS interview_runs (
            user_id TEXT NOT NULL REFERENCES users(id),
            id TEXT NOT NULL,
            data TEXT NOT NULL,
            updated_at INTEGER NOT NULL,
            PRIMARY KEY (user_id, id)
        );
        CREATE TABLE IF NOT EXISTS link_codes (
            code TEXT PRIMARY KEY,
            user_id TEXT NOT NULL REFERENCES users(id),
            expires_at INTEGER NOT NULL
        );
        """
    )
    return conn


def get_conn() -> sqlite3.Connection:
    global _conn
    if _conn is None:
        _conn = _connect()
    return _conn


def create_anonymous_user() -> dict:
    user_id = secrets.token_hex(8)
    token = secrets.token_urlsafe(32)
    with _lock:
        conn = get_conn()
        conn.execute(
            "INSERT INTO users (id, token, created_at) VALUES (?, ?, ?)",
            (user_id, token, int(time.time())),
        )
        conn.commit()
    return {"userId": user_id, "token": token}


def user_by_token(token: str) -> Optional[str]:
    if not token:
        return None
    with _lock:
        row = get_conn().execute(
            "SELECT id FROM users WHERE token = ?", (token,)
        ).fetchone()
    return row[0] if row else None


def get_progress(user_id: str) -> dict:
    with _lock:
        row = get_conn().execute(
            "SELECT data, updated_at FROM progress WHERE user_id = ?", (user_id,)
        ).fetchone()
    if not row:
        return {"data": None, "updatedAt": 0}
    return {"data": row[0], "updatedAt": row[1]}


def put_progress(user_id: str, data: str, updated_at: int) -> None:
    with _lock:
        conn = get_conn()
        conn.execute(
            """
            INSERT INTO progress (user_id, data, updated_at) VALUES (?, ?, ?)
            ON CONFLICT(user_id) DO UPDATE SET data = excluded.data,
                updated_at = excluded.updated_at
            """,
            (user_id, data, updated_at),
        )
        conn.commit()


def create_link_code(user_id: str) -> dict:
    code = "".join(secrets.choice(CODE_ALPHABET) for _ in range(6))
    expires_at = int(time.time()) + CODE_TTL_SECONDS
    with _lock:
        conn = get_conn()
        conn.execute("DELETE FROM link_codes WHERE expires_at < ?", (int(time.time()),))
        conn.execute(
            "INSERT OR REPLACE INTO link_codes (code, user_id, expires_at) VALUES (?, ?, ?)",
            (code, user_id, expires_at),
        )
        conn.commit()
    return {"code": code, "expiresIn": CODE_TTL_SECONDS}


def claim_link_code(code: str) -> Optional[dict]:
    now = int(time.time())
    with _lock:
        conn = get_conn()
        row = conn.execute(
            "SELECT user_id FROM link_codes WHERE code = ? AND expires_at >= ?",
            (code.strip().upper(), now),
        ).fetchone()
        if not row:
            return None
        user_id = row[0]
        token_row = conn.execute(
            "SELECT token FROM users WHERE id = ?", (user_id,)
        ).fetchone()
        conn.execute("DELETE FROM link_codes WHERE code = ?", (code.strip().upper(),))
        conn.commit()
    if not token_row:
        return None
    return {"userId": user_id, "token": token_row[0]}


def get_interview_runs(user_id: str) -> list[dict]:
    with _lock:
        rows = get_conn().execute(
            "SELECT data FROM interview_runs WHERE user_id = ? ORDER BY updated_at DESC LIMIT 30",
            (user_id,),
        ).fetchall()
    return [json.loads(row[0]) for row in rows]


def put_interview_run(user_id: str, run_id: str, data: str, updated_at: int) -> None:
    with _lock:
        conn = get_conn()
        conn.execute(
            """
            INSERT INTO interview_runs (user_id, id, data, updated_at) VALUES (?, ?, ?, ?)
            ON CONFLICT(user_id, id) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at
            WHERE excluded.updated_at > interview_runs.updated_at
            """,
            (user_id, run_id, data, updated_at),
        )
        conn.commit()

"""Хранилище пользователей и прогресса: SQLite (по умолчанию) или Postgres.

Если задана env-переменная DATABASE_URL (postgres://…, например Neon или
Supabase), данные лежат в Postgres и переживают любой redeploy. Иначе SQLite:
путь в DB_PATH (по умолчанию backend/data/app.db); на Render без Persistent
Disk файл обнуляется при redeploy. Локально SQLite работает из коробки.

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

try:  # Postgres нужен только при DATABASE_URL
    import psycopg
except ImportError:  # pragma: no cover
    psycopg = None

_DEFAULT_PATH = Path(__file__).resolve().parents[1] / "data" / "app.db"
_lock = Lock()
_conn = None

CODE_ALPHABET = string.ascii_uppercase + string.digits
CODE_TTL_SECONDS = 600


SCHEMA = [
    """CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        token TEXT UNIQUE NOT NULL,
        created_at BIGINT NOT NULL
    )""",
    """CREATE TABLE IF NOT EXISTS progress (
        user_id TEXT PRIMARY KEY REFERENCES users(id),
        data TEXT NOT NULL,
        updated_at BIGINT NOT NULL
    )""",
    """CREATE TABLE IF NOT EXISTS interview_runs (
        user_id TEXT NOT NULL REFERENCES users(id),
        id TEXT NOT NULL,
        data TEXT NOT NULL,
        updated_at BIGINT NOT NULL,
        PRIMARY KEY (user_id, id)
    )""",
    """CREATE TABLE IF NOT EXISTS link_codes (
        code TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id),
        expires_at BIGINT NOT NULL
    )""",
]


def database_url() -> str:
    url = os.getenv("DATABASE_URL", "").strip()
    # Некоторые хостинги отдают устаревшую схему postgres://
    return "postgresql://" + url[len("postgres://"):] if url.startswith("postgres://") else url


def using_postgres() -> bool:
    return bool(database_url())


def _status_sql() -> str:
    """Выражение «поле status внутри JSON-колонки data»."""
    return "(data::json->>'status')" if using_postgres() else "json_extract(data, '$.status')"


class _PgConn:
    """Тонкая обёртка над psycopg с интерфейсом sqlite3 (? → %s, autocommit,
    одно переподключение, если соединение закрыл сервер: Neon так делает при простое)."""

    def __init__(self, url: str) -> None:
        self.url = url
        self.conn = None
        self._open()

    def _open(self) -> None:
        self.conn = psycopg.connect(self.url, autocommit=True, connect_timeout=15)

    def execute(self, sql: str, params: tuple = ()):
        sql = sql.replace("?", "%s")
        try:
            return self.conn.execute(sql, params)
        except (psycopg.OperationalError, psycopg.InterfaceError):
            self._open()
            return self.conn.execute(sql, params)

    def commit(self) -> None:  # autocommit
        pass

    def close(self) -> None:
        try:
            self.conn.close()
        except Exception:
            pass


def _connect():
    if using_postgres():
        if psycopg is None:
            raise RuntimeError("DATABASE_URL задан, но пакет psycopg не установлен")
        conn = _PgConn(database_url())
        for statement in SCHEMA:
            conn.execute(statement)
        return conn
    db_path = Path(os.getenv("DB_PATH", str(_DEFAULT_PATH)))
    db_path.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(str(db_path), check_same_thread=False)
    conn.execute("PRAGMA journal_mode=WAL")
    for statement in SCHEMA:
        conn.execute(statement)
    conn.commit()
    return conn


def get_conn():
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
            """INSERT INTO link_codes (code, user_id, expires_at) VALUES (?, ?, ?)
               ON CONFLICT(code) DO UPDATE SET user_id = excluded.user_id,
                   expires_at = excluded.expires_at""",
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
            f"""SELECT data FROM interview_runs
               WHERE user_id = ? AND {_status_sql()} = 'finished'
               ORDER BY updated_at DESC LIMIT 30""",
            (user_id,),
        ).fetchall()
    return [json.loads(row[0]) for row in rows]


def discard_incomplete_interview_runs(user_id: str) -> list[dict]:
    with _lock:
        conn = get_conn()
        condition = f"user_id = ? AND {_status_sql()} IN ('briefing', 'active')"
        rows = conn.execute(
            f"SELECT data FROM interview_runs WHERE {condition} ORDER BY updated_at DESC LIMIT 150",
            (user_id,),
        ).fetchall()
        conn.execute(f"DELETE FROM interview_runs WHERE {condition}", (user_id,))
        conn.commit()

    seen = []
    for (data,) in rows:
        run = json.loads(data)
        skeleton, seed = run["skeleton"], run["seed"]
        if not skeleton.get("id"):
            continue
        brief = {"id": run["id"], "createdAt": run.get("createdAt"), "skeleton": {"id": skeleton["id"]}}
        configured, settings = run.get("configured"), run.get("settings")
        if isinstance(configured, dict) and isinstance(settings, dict):
            brief.update(
                seed={"intro": seed.get("intro")},
                configured={"variantId": configured.get("variantId"), "fingerprints": configured.get("fingerprints")},
                settings={"industry": settings.get("industry"), "interviewType": settings.get("interviewType")},
            )
        else:
            brief["seed"] = {key: seed.get(key) for key in ("industryIndex", "truthIndex")}
        seen.append(brief)
    return seen


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

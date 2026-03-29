import sqlite3
from datetime import datetime
from pathlib import Path

DB_PATH = Path(__file__).parent / "cognisync.db"


def _conn():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


def init_db():
    conn = _conn()
    conn.executescript("""
        CREATE TABLE IF NOT EXISTS sessions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            task_type TEXT NOT NULL,
            subjective_score INTEGER NOT NULL,
            created_at TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS pvt_trials (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            session_id INTEGER NOT NULL REFERENCES sessions(id),
            trial_number INTEGER NOT NULL,
            isi_ms INTEGER NOT NULL,
            reaction_time_ms REAL,
            is_false_start INTEGER NOT NULL DEFAULT 0
        );
        CREATE TABLE IF NOT EXISTS flanker_trials (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            session_id INTEGER NOT NULL REFERENCES sessions(id),
            trial_number INTEGER NOT NULL,
            is_congruent INTEGER NOT NULL,
            stimulus TEXT NOT NULL,
            correct_response TEXT NOT NULL,
            user_response TEXT,
            is_correct INTEGER NOT NULL,
            reaction_time_ms REAL
        );
    """)
    conn.commit()
    conn.close()


def save_pvt_session(subjective_score: int, trials: list[dict]) -> int:
    conn = _conn()
    cur = conn.cursor()
    cur.execute(
        "INSERT INTO sessions (task_type, subjective_score, created_at) VALUES (?, ?, ?)",
        ("pvt", subjective_score, datetime.now().isoformat()),
    )
    sid = cur.lastrowid
    for t in trials:
        cur.execute(
            "INSERT INTO pvt_trials (session_id, trial_number, isi_ms, reaction_time_ms, is_false_start) "
            "VALUES (?, ?, ?, ?, ?)",
            (sid, t["trial_number"], t["isi_ms"], t.get("reaction_time_ms"), int(t.get("is_false_start", False))),
        )
    conn.commit()
    conn.close()
    return sid


def save_flanker_session(subjective_score: int, trials: list[dict]) -> int:
    conn = _conn()
    cur = conn.cursor()
    cur.execute(
        "INSERT INTO sessions (task_type, subjective_score, created_at) VALUES (?, ?, ?)",
        ("flanker", subjective_score, datetime.now().isoformat()),
    )
    sid = cur.lastrowid
    for t in trials:
        cur.execute(
            "INSERT INTO flanker_trials "
            "(session_id, trial_number, is_congruent, stimulus, correct_response, user_response, is_correct, reaction_time_ms) "
            "VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
            (
                sid, t["trial_number"], int(t["is_congruent"]), t["stimulus"],
                t["correct_response"], t.get("user_response"), int(t["is_correct"]),
                t.get("reaction_time_ms"),
            ),
        )
    conn.commit()
    conn.close()
    return sid


def get_sessions(task_type: str | None = None) -> list[dict]:
    conn = _conn()
    if task_type:
        rows = conn.execute(
            "SELECT * FROM sessions WHERE task_type = ? ORDER BY created_at DESC",
            (task_type,),
        ).fetchall()
    else:
        rows = conn.execute("SELECT * FROM sessions ORDER BY created_at DESC").fetchall()
    conn.close()
    return [dict(r) for r in rows]


def get_pvt_trials(session_id: int) -> list[dict]:
    conn = _conn()
    rows = conn.execute(
        "SELECT * FROM pvt_trials WHERE session_id = ? ORDER BY trial_number",
        (session_id,),
    ).fetchall()
    conn.close()
    return [dict(r) for r in rows]


def get_flanker_trials(session_id: int) -> list[dict]:
    conn = _conn()
    rows = conn.execute(
        "SELECT * FROM flanker_trials WHERE session_id = ? ORDER BY trial_number",
        (session_id,),
    ).fetchall()
    conn.close()
    return [dict(r) for r in rows]


def delete_session(session_id: int) -> None:
    conn = _conn()
    conn.execute("DELETE FROM pvt_trials WHERE session_id = ?", (session_id,))
    conn.execute("DELETE FROM flanker_trials WHERE session_id = ?", (session_id,))
    conn.execute("DELETE FROM sessions WHERE id = ?", (session_id,))
    conn.commit()
    conn.close()


def delete_all_sessions(task_type: str) -> None:
    conn = _conn()
    cur = conn.cursor()
    ids = [r[0] for r in cur.execute(
        "SELECT id FROM sessions WHERE task_type = ?", (task_type,)
    ).fetchall()]
    if ids:
        placeholders = ",".join("?" * len(ids))
        cur.execute(f"DELETE FROM pvt_trials WHERE session_id IN ({placeholders})", ids)
        cur.execute(f"DELETE FROM flanker_trials WHERE session_id IN ({placeholders})", ids)
        cur.execute(f"DELETE FROM sessions WHERE task_type = ?", (task_type,))
    conn.commit()
    conn.close()

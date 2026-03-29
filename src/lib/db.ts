import Database from "better-sqlite3";
import path from "path";

const DB_PATH = path.join(process.cwd(), "cognisync.db");

let _db: Database.Database | null = null;

function getDb(): Database.Database {
  if (!_db) {
    _db = new Database(DB_PATH);
    _db.pragma("foreign_keys = ON");
    _db.exec(`
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
    `);
  }
  return _db;
}

interface PvtTrialInput {
  trial_number: number;
  isi_ms: number;
  reaction_time_ms: number | null;
  is_false_start: boolean;
}

interface FlankerTrialInput {
  trial_number: number;
  is_congruent: boolean;
  stimulus: string;
  correct_response: string;
  user_response: string | null;
  is_correct: boolean;
  reaction_time_ms: number;
}

export function savePvtSession(
  subjectiveScore: number,
  trials: PvtTrialInput[]
): number {
  const db = getDb();
  const insertSession = db.prepare(
    "INSERT INTO sessions (task_type, subjective_score, created_at) VALUES (?, ?, ?)"
  );
  const insertTrial = db.prepare(
    "INSERT INTO pvt_trials (session_id, trial_number, isi_ms, reaction_time_ms, is_false_start) VALUES (?, ?, ?, ?, ?)"
  );

  const transaction = db.transaction(() => {
    const info = insertSession.run("pvt", subjectiveScore, new Date().toISOString());
    const sessionId = info.lastInsertRowid as number;
    for (const t of trials) {
      insertTrial.run(
        sessionId,
        t.trial_number,
        t.isi_ms,
        t.reaction_time_ms,
        t.is_false_start ? 1 : 0
      );
    }
    return sessionId;
  });

  return transaction();
}

export function saveFlankerSession(
  subjectiveScore: number,
  trials: FlankerTrialInput[]
): number {
  const db = getDb();
  const insertSession = db.prepare(
    "INSERT INTO sessions (task_type, subjective_score, created_at) VALUES (?, ?, ?)"
  );
  const insertTrial = db.prepare(
    "INSERT INTO flanker_trials (session_id, trial_number, is_congruent, stimulus, correct_response, user_response, is_correct, reaction_time_ms) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
  );

  const transaction = db.transaction(() => {
    const info = insertSession.run("flanker", subjectiveScore, new Date().toISOString());
    const sessionId = info.lastInsertRowid as number;
    for (const t of trials) {
      insertTrial.run(
        sessionId,
        t.trial_number,
        t.is_congruent ? 1 : 0,
        t.stimulus,
        t.correct_response,
        t.user_response,
        t.is_correct ? 1 : 0,
        t.reaction_time_ms
      );
    }
    return sessionId;
  });

  return transaction();
}

export function getSessions(taskType?: string) {
  const db = getDb();
  if (taskType) {
    return db
      .prepare("SELECT * FROM sessions WHERE task_type = ? ORDER BY created_at DESC")
      .all(taskType);
  }
  return db.prepare("SELECT * FROM sessions ORDER BY created_at DESC").all();
}

export function getPvtTrials(sessionId: number) {
  const db = getDb();
  const rows = db
    .prepare("SELECT * FROM pvt_trials WHERE session_id = ? ORDER BY trial_number")
    .all(sessionId) as Array<Record<string, unknown>>;
  return rows.map((r) => ({
    ...r,
    is_false_start: !!r.is_false_start,
  }));
}

export function getFlankerTrials(sessionId: number) {
  const db = getDb();
  const rows = db
    .prepare("SELECT * FROM flanker_trials WHERE session_id = ? ORDER BY trial_number")
    .all(sessionId) as Array<Record<string, unknown>>;
  return rows.map((r) => ({
    ...r,
    is_congruent: !!r.is_congruent,
    is_correct: !!r.is_correct,
  }));
}

export function getSessionById(sessionId: number) {
  const db = getDb();
  return db.prepare("SELECT * FROM sessions WHERE id = ?").get(sessionId) as
    | Record<string, unknown>
    | undefined;
}

export function deleteSession(sessionId: number) {
  const db = getDb();
  const transaction = db.transaction(() => {
    db.prepare("DELETE FROM pvt_trials WHERE session_id = ?").run(sessionId);
    db.prepare("DELETE FROM flanker_trials WHERE session_id = ?").run(sessionId);
    db.prepare("DELETE FROM sessions WHERE id = ?").run(sessionId);
  });
  transaction();
}

export function deleteAllSessions(taskType: string) {
  const db = getDb();
  const transaction = db.transaction(() => {
    const ids = db
      .prepare("SELECT id FROM sessions WHERE task_type = ?")
      .all(taskType) as Array<{ id: number }>;
    if (ids.length > 0) {
      const placeholders = ids.map(() => "?").join(",");
      const idValues = ids.map((r) => r.id);
      db.prepare(`DELETE FROM pvt_trials WHERE session_id IN (${placeholders})`).run(
        ...idValues
      );
      db.prepare(
        `DELETE FROM flanker_trials WHERE session_id IN (${placeholders})`
      ).run(...idValues);
      db.prepare("DELETE FROM sessions WHERE task_type = ?").run(taskType);
    }
  });
  transaction();
}

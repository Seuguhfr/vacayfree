-- Migration 0001: Initial D1 schema for VacayFree
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS events (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  destination_hint TEXT,
  start_date TEXT NOT NULL,
  end_date TEXT NOT NULL,
  default_duration_days INTEGER NOT NULL DEFAULT 7,
  admin_key_hash TEXT NOT NULL,
  is_locked INTEGER NOT NULL DEFAULT 0,
  locked_start_date TEXT,
  locked_end_date TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  expires_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS participants (
  id TEXT NOT NULL,
  event_id TEXT NOT NULL,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT 'bg-emerald-600',
  pin_hash TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL,
  PRIMARY KEY (event_id, id),
  FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS responses (
  event_id TEXT NOT NULL,
  participant_id TEXT NOT NULL,
  availability TEXT NOT NULL DEFAULT '{}',
  updated_at TEXT NOT NULL,
  PRIMARY KEY (event_id, participant_id),
  FOREIGN KEY (event_id, participant_id) REFERENCES participants(event_id, id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_events_expires_at ON events(expires_at);
CREATE INDEX IF NOT EXISTS idx_participants_event_id ON participants(event_id);
CREATE INDEX IF NOT EXISTS idx_responses_event_id ON responses(event_id);

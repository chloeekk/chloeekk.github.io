CREATE TABLE topics (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name_zh TEXT NOT NULL,
  name_en TEXT NOT NULL,
  color TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived')),
  created_at_ms INTEGER NOT NULL,
  updated_at_ms INTEGER NOT NULL
);

CREATE TABLE time_entries (
  id TEXT PRIMARY KEY,
  topic_id TEXT NOT NULL,
  source TEXT NOT NULL CHECK (source IN ('timer', 'manual')),
  status TEXT NOT NULL CHECK (status IN ('running', 'paused', 'completed', 'cancelled')),
  visibility TEXT NOT NULL DEFAULT 'public' CHECK (visibility IN ('public', 'private')),
  task TEXT,
  note TEXT,
  entry_date TEXT NOT NULL,
  timezone TEXT NOT NULL,
  started_at_ms INTEGER,
  ended_at_ms INTEGER,
  calculated_duration_seconds INTEGER,
  duration_seconds INTEGER,
  related_post_url TEXT,
  version INTEGER NOT NULL DEFAULT 1 CHECK (version >= 1),
  completed_at_ms INTEGER,
  cancelled_at_ms INTEGER,
  created_at_ms INTEGER NOT NULL,
  updated_at_ms INTEGER NOT NULL,
  FOREIGN KEY (topic_id) REFERENCES topics(id) ON DELETE RESTRICT,
  CHECK (duration_seconds IS NULL OR duration_seconds > 0),
  CHECK (calculated_duration_seconds IS NULL OR calculated_duration_seconds >= 0),
  CHECK (ended_at_ms IS NULL OR started_at_ms IS NULL OR ended_at_ms >= started_at_ms),
  CHECK (source <> 'timer' OR started_at_ms IS NOT NULL),
  CHECK (
    (status IN ('running', 'paused') AND source = 'timer' AND ended_at_ms IS NULL
      AND duration_seconds IS NULL AND completed_at_ms IS NULL AND cancelled_at_ms IS NULL)
    OR
    (status = 'completed' AND duration_seconds IS NOT NULL
      AND completed_at_ms IS NOT NULL AND cancelled_at_ms IS NULL)
    OR
    (status = 'cancelled' AND cancelled_at_ms IS NOT NULL)
  )
);

CREATE TABLE time_entry_pauses (
  id TEXT PRIMARY KEY,
  time_entry_id TEXT NOT NULL,
  paused_at_ms INTEGER NOT NULL,
  resumed_at_ms INTEGER,
  created_at_ms INTEGER NOT NULL,
  FOREIGN KEY (time_entry_id) REFERENCES time_entries(id) ON DELETE CASCADE,
  CHECK (resumed_at_ms IS NULL OR resumed_at_ms >= paused_at_ms)
);

CREATE TABLE owner_devices (
  id TEXT PRIMARY KEY,
  token_hash TEXT NOT NULL UNIQUE,
  label TEXT,
  created_at_ms INTEGER NOT NULL,
  expires_at_ms INTEGER NOT NULL,
  last_used_at_ms INTEGER NOT NULL,
  revoked_at_ms INTEGER
);

CREATE TABLE interest_signals (
  id TEXT PRIMARY KEY,
  client_hash TEXT NOT NULL UNIQUE,
  created_at_ms INTEGER NOT NULL
);

CREATE UNIQUE INDEX ux_time_entries_one_active ON time_entries ((1))
  WHERE status IN ('running', 'paused');
CREATE UNIQUE INDEX ux_pauses_one_open_per_entry ON time_entry_pauses (time_entry_id)
  WHERE resumed_at_ms IS NULL;
CREATE INDEX ix_entries_public_recent
  ON time_entries (visibility, status, entry_date DESC, id DESC);
CREATE INDEX ix_entries_public_topic_recent
  ON time_entries (topic_id, visibility, status, entry_date DESC, id DESC);
CREATE INDEX ix_entries_owner_status_updated
  ON time_entries (status, updated_at_ms DESC, id DESC);
CREATE INDEX ix_pauses_entry_time
  ON time_entry_pauses (time_entry_id, paused_at_ms);

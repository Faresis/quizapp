CREATE TABLE focus_sessions (id TEXT PRIMARY KEY, child_id TEXT NOT NULL REFERENCES users(id), created_by TEXT NOT NULL REFERENCES users(id), title TEXT NOT NULL, target_skill TEXT NOT NULL, kind TEXT NOT NULL, scheduled_for TEXT NOT NULL, duration_ms INTEGER NOT NULL, collect_ratings INTEGER NOT NULL DEFAULT 0, started_at INTEGER, ends_at INTEGER, completed_at INTEGER, data TEXT NOT NULL);
--> statement-breakpoint
CREATE TABLE session_rounds (session_id TEXT NOT NULL REFERENCES focus_sessions(id), assignment_id TEXT NOT NULL UNIQUE REFERENCES assignments(id), position INTEGER NOT NULL, PRIMARY KEY(session_id,position));
--> statement-breakpoint
CREATE TABLE focus_observations (id TEXT PRIMARY KEY, child_id TEXT NOT NULL REFERENCES users(id), session_id TEXT REFERENCES focus_sessions(id), observer_id TEXT NOT NULL REFERENCES users(id), created_at INTEGER NOT NULL, context TEXT NOT NULL, strategy TEXT NOT NULL, independent INTEGER NOT NULL DEFAULT 0, note TEXT NOT NULL);
--> statement-breakpoint
CREATE TABLE coach_tokens (id TEXT PRIMARY KEY, parent_id TEXT NOT NULL REFERENCES users(id), label TEXT NOT NULL, token_hash TEXT NOT NULL UNIQUE, scopes TEXT NOT NULL, child_ids TEXT NOT NULL, expires_at INTEGER NOT NULL, revoked_at INTEGER, created_at INTEGER NOT NULL);
--> statement-breakpoint
CREATE TABLE coach_drafts (id TEXT PRIMARY KEY, token_id TEXT NOT NULL REFERENCES coach_tokens(id), definition TEXT NOT NULL, created_at INTEGER NOT NULL);
--> statement-breakpoint
CREATE UNIQUE INDEX focus_plan_date ON focus_sessions(child_id,scheduled_for,json_extract(data,'$.plan_id')) WHERE json_extract(data,'$.plan_id') IS NOT NULL;

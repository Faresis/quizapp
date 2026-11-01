CREATE TABLE users (id TEXT PRIMARY KEY, username TEXT NOT NULL UNIQUE, name TEXT NOT NULL, role TEXT NOT NULL CHECK(role IN ('admin','parent','child')), parent_id TEXT REFERENCES users(id), password_hash TEXT NOT NULL, must_change INTEGER NOT NULL DEFAULT 1, deleted_at INTEGER, created_at INTEGER NOT NULL);
--> statement-breakpoint
CREATE TABLE sessions (token_hash TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id), expires_at INTEGER NOT NULL);
--> statement-breakpoint
CREATE TABLE login_limits (username TEXT PRIMARY KEY, failures INTEGER NOT NULL, reset_at INTEGER NOT NULL);
--> statement-breakpoint
CREATE TABLE tests (id TEXT PRIMARY KEY, owner_id TEXT NOT NULL REFERENCES users(id), title TEXT NOT NULL, created_at INTEGER NOT NULL);
--> statement-breakpoint
CREATE TABLE versions (id TEXT PRIMARY KEY, test_id TEXT NOT NULL REFERENCES tests(id), number INTEGER NOT NULL, definition TEXT NOT NULL, created_at INTEGER NOT NULL, UNIQUE(test_id,number));
--> statement-breakpoint
CREATE TABLE assignments (id TEXT PRIMARY KEY, parent_id TEXT NOT NULL REFERENCES users(id), child_id TEXT NOT NULL REFERENCES users(id), version_id TEXT NOT NULL REFERENCES versions(id), due_date TEXT NOT NULL, timezone TEXT NOT NULL, created_at INTEGER NOT NULL);
--> statement-breakpoint
CREATE INDEX assignments_child ON assignments(child_id);
--> statement-breakpoint
CREATE TABLE attempts (id TEXT PRIMARY KEY, assignment_id TEXT NOT NULL REFERENCES assignments(id), number INTEGER NOT NULL, state TEXT NOT NULL, started_at INTEGER NOT NULL, completed_at INTEGER, data TEXT NOT NULL, revision INTEGER NOT NULL DEFAULT 0, UNIQUE(assignment_id,number));
--> statement-breakpoint
CREATE UNIQUE INDEX one_active_attempt ON attempts(assignment_id) WHERE state='in_progress';
--> statement-breakpoint
CREATE TABLE audit (id TEXT PRIMARY KEY, actor_id TEXT NOT NULL, action TEXT NOT NULL, target_id TEXT NOT NULL, created_at INTEGER NOT NULL);

CREATE TABLE catalog_enrollments (id TEXT PRIMARY KEY, request_id TEXT NOT NULL, request_hash TEXT NOT NULL, child_id TEXT NOT NULL REFERENCES users(id), created_by TEXT NOT NULL REFERENCES users(id), content_id TEXT NOT NULL, content_kind TEXT NOT NULL, content_hash TEXT NOT NULL, snapshot TEXT NOT NULL, start_date TEXT NOT NULL, timezone TEXT NOT NULL, created_at INTEGER NOT NULL, UNIQUE(request_id,child_id));
--> statement-breakpoint
CREATE TABLE catalog_links (enrollment_id TEXT NOT NULL REFERENCES catalog_enrollments(id), assignment_id TEXT NOT NULL UNIQUE REFERENCES assignments(id), session_id TEXT REFERENCES focus_sessions(id), position INTEGER NOT NULL, step_title TEXT NOT NULL, PRIMARY KEY(enrollment_id,position));
--> statement-breakpoint
CREATE INDEX catalog_child ON catalog_enrollments(child_id,created_at);

CREATE TABLE coach_connections (site_user_id TEXT PRIMARY KEY, token_id TEXT NOT NULL REFERENCES coach_tokens(id), authorized_by TEXT NOT NULL REFERENCES users(id), created_at INTEGER NOT NULL);

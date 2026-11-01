-- Retain unpublished definitions as shared parent drafts; remove all coach grants.
DROP TABLE coach_connections;
--> statement-breakpoint
ALTER TABLE coach_drafts DROP COLUMN token_id;
--> statement-breakpoint
ALTER TABLE coach_drafts RENAME TO test_drafts;
--> statement-breakpoint
DROP TABLE coach_tokens;

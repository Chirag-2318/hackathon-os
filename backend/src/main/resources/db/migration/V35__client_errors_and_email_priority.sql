-- V35__client_errors_and_email_priority.sql
-- Client errors reporting and email queue priority

CREATE TABLE IF NOT EXISTS client_errors (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    route VARCHAR(255),
    message VARCHAR(500) NOT NULL,
    stack TEXT,
    build_id VARCHAR(100),
    user_agent VARCHAR(300),
    count INT NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_client_errors_created_at ON client_errors (created_at);
CREATE INDEX IF NOT EXISTS idx_client_errors_dedupe ON client_errors (route, message, last_seen_at);

ALTER TABLE email_outbox ADD COLUMN IF NOT EXISTS priority INT NOT NULL DEFAULT 0;
DROP INDEX IF EXISTS idx_email_outbox_pending;
CREATE INDEX IF NOT EXISTS idx_email_outbox_pending_priority ON email_outbox (status, priority DESC, next_attempt_at);

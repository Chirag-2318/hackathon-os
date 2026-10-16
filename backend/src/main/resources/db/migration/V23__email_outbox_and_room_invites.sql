-- V23__email_outbox_and_room_invites.sql
-- Email outbox queue, notification preferences, and leader-managed email room invites

ALTER TABLE users
    ADD COLUMN IF NOT EXISTS email_reminders BOOLEAN NOT NULL DEFAULT true;

CREATE TABLE IF NOT EXISTS email_outbox (
    id UUID PRIMARY KEY,
    to_email VARCHAR(255) NOT NULL,
    template VARCHAR(50) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    attempts INT NOT NULL DEFAULT 0,
    next_attempt_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_error VARCHAR(300),
    dedupe_key VARCHAR(255) UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    sent_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_email_outbox_pending ON email_outbox (status, next_attempt_at);
CREATE INDEX IF NOT EXISTS idx_email_outbox_hourly_rate ON email_outbox (to_email, status, sent_at);
CREATE INDEX IF NOT EXISTS idx_email_outbox_daily_rate ON email_outbox (status, sent_at);

CREATE TABLE IF NOT EXISTS room_invites (
    id UUID PRIMARY KEY,
    room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    email_normalized VARCHAR(255) NOT NULL,
    token_hash VARCHAR(64) NOT NULL UNIQUE,
    invited_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    note VARCHAR(140),
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    send_count INT NOT NULL DEFAULT 1,
    accepted_by UUID REFERENCES users(id) ON DELETE SET NULL,
    accepted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_room_invites_room_status ON room_invites (room_id, status);
CREATE INDEX IF NOT EXISTS idx_room_invites_email ON room_invites (email_normalized);
CREATE INDEX IF NOT EXISTS idx_room_invites_token_hash ON room_invites (token_hash);
CREATE INDEX IF NOT EXISTS idx_room_invites_invited_by_rate ON room_invites (invited_by, created_at);

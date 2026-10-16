-- V34__app_settings_and_waitlist.sql
-- Platform settings, waitlist signups, and user upload usage tracking

CREATE TABLE IF NOT EXISTS app_settings (
    key VARCHAR(100) PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO app_settings (key, value, updated_at)
VALUES ('signups_open', 'true', now())
ON CONFLICT (key) DO NOTHING;

CREATE TABLE IF NOT EXISTS waitlist_signups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL UNIQUE,
    source VARCHAR(50) DEFAULT 'WEB',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_waitlist_signups_email ON waitlist_signups (email);
CREATE INDEX IF NOT EXISTS idx_waitlist_signups_created_at ON waitlist_signups (created_at DESC);

CREATE TABLE IF NOT EXISTS user_upload_usage (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    total_bytes BIGINT NOT NULL DEFAULT 0,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

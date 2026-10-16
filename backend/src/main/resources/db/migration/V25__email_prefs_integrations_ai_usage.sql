-- V25__email_prefs_integrations_ai_usage.sql
-- Notification email preferences, master pause, AI daily usage tracking, and integration status

-- 1. Master email pause switch on users
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_paused BOOLEAN NOT NULL DEFAULT false;

-- 2. User email category preferences (defaults ON when no row exists)
CREATE TABLE IF NOT EXISTS user_email_prefs (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category VARCHAR(50) NOT NULL,
    enabled BOOLEAN NOT NULL DEFAULT true,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (user_id, category)
);

-- Migrate existing email_reminders into CLOCK_REMINDERS category
INSERT INTO user_email_prefs (user_id, category, enabled, updated_at)
SELECT id, 'CLOCK_REMINDERS', email_reminders, now()
FROM users
ON CONFLICT (user_id, category) DO NOTHING;

-- 3. AI daily usage tracking (no prompt text or keys stored)
CREATE TABLE IF NOT EXISTS ai_usage_daily (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    day DATE NOT NULL,
    calls INT NOT NULL DEFAULT 0,
    failures INT NOT NULL DEFAULT 0,
    PRIMARY KEY (user_id, day)
);

CREATE INDEX IF NOT EXISTS idx_ai_usage_daily_user_day ON ai_usage_daily (user_id, day DESC);

-- 4. User OAuth token connection metadata (for Integrations management)
ALTER TABLE user_oauth_tokens ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'CONNECTED';
ALTER TABLE user_oauth_tokens ADD COLUMN IF NOT EXISTS connected_at TIMESTAMPTZ NOT NULL DEFAULT now();
ALTER TABLE user_oauth_tokens ADD COLUMN IF NOT EXISTS last_used_at TIMESTAMPTZ;
